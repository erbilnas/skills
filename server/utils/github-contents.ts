import type { H3Event } from "h3";
import { requireGithubWrite } from "./admin-session";

interface GithubContentResponse {
  sha?: string;
  message?: string;
  encoding?: string;
  content?: string | { path?: string; sha?: string; html_url?: string };
  path?: string;
  html_url?: string;
}

export function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "skills-erbilnas-com",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function contentUrl(repo: string, path: string) {
  return `https://api.github.com/repos/${repo}/contents/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export function tryGithubWriteRuntime(event?: H3Event) {
  try {
    return requireGithubWrite(event);
  } catch {
    return null;
  }
}

export async function listFileCommits(
  event: H3Event,
  path: string,
  limit = 12,
): Promise<
  Array<{
    sha: string;
    message: string;
    date: string | null;
    url: string | null;
    author: string | null;
  }>
> {
  const runtime = tryGithubWriteRuntime(event);
  if (!runtime) return [];

  const url = new URL(
    `https://api.github.com/repos/${runtime.repo}/commits`,
  );
  url.searchParams.set("path", path);
  url.searchParams.set("sha", runtime.branch);
  url.searchParams.set("per_page", String(Math.min(limit, 30)));

  const res = await fetch(url, { headers: githubHeaders(runtime.token) });
  if (!res.ok) return [];

  const json = (await res.json()) as Array<{
    sha?: string;
    html_url?: string;
    commit?: {
      message?: string;
      author?: { name?: string; date?: string };
    };
    author?: { login?: string };
  }>;

  return (json || []).map((entry) => ({
    sha: (entry.sha || "").slice(0, 7),
    message: String(entry.commit?.message || "")
      .split("\n")[0]
      ?.trim() || "commit",
    date: entry.commit?.author?.date || null,
    url: entry.html_url || null,
    author: entry.author?.login || entry.commit?.author?.name || null,
  }));
}

export async function listRepoDocPaths(
  event: H3Event,
  input: { owner: string; repo: string; ref: string; prefix: string },
): Promise<string[]> {
  const runtime = requireGithubWrite(event);
  const url = `https://api.github.com/repos/${input.owner}/${input.repo}/git/trees/${encodeURIComponent(input.ref)}?recursive=1`;
  const res = await fetch(url, { headers: githubHeaders(runtime.token) });
  if (!res.ok) {
    const body = await res.text();
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to list GitHub tree",
      data: { status: res.status, body },
    });
  }

  const json = (await res.json()) as {
    tree?: Array<{ path?: string; type?: string }>;
    truncated?: boolean;
  };

  const prefix = input.prefix.replace(/^\/+|\/+$/g, "");
  const docs = (json.tree || [])
    .filter((node) => node.type === "blob" && node.path)
    .map((node) => String(node.path))
    .filter((path) => {
      if (prefix && path !== prefix && !path.startsWith(`${prefix}/`)) {
        return false;
      }
      const base = path.split("/").pop()?.toLowerCase() || "";
      return (
        base === "skill.md" ||
        base === "mcp.md" ||
        base === "rule.md" ||
        base.endsWith(".mdc")
      );
    });

  return docs;
}

export async function fetchRawGithubFile(
  event: H3Event,
  input: { owner: string; repo: string; ref: string; path: string },
) {
  const runtime = requireGithubWrite(event);
  const url = `https://api.github.com/repos/${input.owner}/${input.repo}/contents/${input.path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}?ref=${encodeURIComponent(input.ref)}`;
  const res = await fetch(url, { headers: githubHeaders(runtime.token) });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to read remote GitHub file",
    });
  }
  const json = (await res.json()) as {
    content?: string;
    encoding?: string;
  };
  if (typeof json.content !== "string") return null;
  return json.encoding === "base64"
    ? Buffer.from(json.content.replace(/\n/g, ""), "base64").toString("utf8")
    : json.content;
}

export async function getFileSha(
  event: H3Event,
  path: string,
): Promise<string | null> {
  const file = await getGithubFile(event, path);
  return file?.sha || null;
}

export async function getGithubFile(
  event: H3Event,
  path: string,
): Promise<{ sha: string; content: string; htmlUrl: string | null } | null> {
  const { token, repo, branch } = requireGithubWrite(event);
  const url = new URL(contentUrl(repo, path));
  url.searchParams.set("ref", branch);

  const res = await fetch(url, { headers: githubHeaders(token) });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    const body = await res.text();
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to read GitHub content",
      data: { status: res.status, body },
    });
  }

  const json = (await res.json()) as GithubContentResponse & {
    content?: string;
    encoding?: string;
    html_url?: string;
  };

  if (typeof json.content !== "string") {
    return null;
  }

  const decoded =
    json.encoding === "base64"
      ? Buffer.from(json.content.replace(/\n/g, ""), "base64").toString("utf8")
      : json.content;

  return {
    sha: json.sha || "",
    content: decoded,
    htmlUrl: json.html_url || null,
  };
}

export async function putCatalogFile(
  event: H3Event,
  input: {
    path: string;
    content: string;
    message: string;
    sha?: string | null;
  },
) {
  const { token, repo, branch } = requireGithubWrite(event);
  const url = contentUrl(repo, input.path);

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      ...githubHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: input.message,
      content: Buffer.from(input.content, "utf8").toString("base64"),
      branch,
      ...(input.sha ? { sha: input.sha } : {}),
    }),
  });

  const json = (await res.json()) as {
    message?: string;
    content?: { path?: string; sha?: string; html_url?: string };
  };
  if (!res.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: json.message || "Failed to write GitHub content",
      data: { status: res.status, body: json },
    });
  }

  return {
    path: json.content?.path || input.path,
    sha: json.content?.sha || null,
    htmlUrl: json.content?.html_url || null,
    content: input.content,
  };
}

export async function deleteCatalogFile(
  event: H3Event,
  input: {
    path: string;
    message: string;
    sha: string;
  },
) {
  const { token, repo, branch } = requireGithubWrite(event);
  const url = contentUrl(repo, input.path);

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      ...githubHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: input.message,
      sha: input.sha,
      branch,
    }),
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    throw createError({
      statusCode: 502,
      statusMessage: json.message || "Failed to delete GitHub content",
      data: { status: res.status, body: json },
    });
  }

  return { path: input.path, deleted: true };
}

/** @deprecated use putCatalogFile */
export async function putSkillFile(
  event: H3Event,
  input: {
    path: string;
    content: string;
    message: string;
    sha?: string | null;
  },
) {
  return putCatalogFile(event, input);
}
