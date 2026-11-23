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

function githubHeaders(token: string) {
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
