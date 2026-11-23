import type { H3Event } from "h3";
import matter from "gray-matter";
import type { CatalogKind } from "./catalog";
import { DOC_FILE, buildCatalogMarkdown } from "./catalog";
import { isValidSkillName } from "./skills";
import { getFileSha, putCatalogFile } from "./github-contents";

const ALLOWED_HOSTS = new Set(["github.com", "www.github.com", "raw.githubusercontent.com"]);

export function slugifyImportName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function inferKindFromFilename(filename: string): CatalogKind {
  const base = filename.split(/[/\\]/).pop()?.toLowerCase() || "";
  if (base === "mcp.md") return "mcps";
  if (base === "rule.md" || base.endsWith(".mdc")) return "rules";
  return "skills";
}

/** Convert blob/tree GitHub URLs to raw content URLs when possible. */
export function githubUrlToRaw(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw createError({ statusCode: 400, statusMessage: "Invalid URL" });
  }

  if (!ALLOWED_HOSTS.has(url.hostname)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Only github.com or raw.githubusercontent.com URLs are allowed",
    });
  }

  if (url.hostname === "raw.githubusercontent.com") {
    return url.toString();
  }

  // github.com/owner/repo/blob/branch/path
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length >= 5 && parts[2] === "blob") {
    const [owner, repo, , branch, ...rest] = parts;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${rest.join("/")}`;
  }

  // github.com/owner/repo/tree/branch/path → assume SKILL.md in folder
  if (parts.length >= 4 && parts[2] === "tree") {
    const [owner, repo, , branch, ...rest] = parts;
    const folder = rest.join("/");
    const path = folder ? `${folder}/SKILL.md` : "SKILL.md";
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  }

  throw createError({
    statusCode: 400,
    statusMessage:
      "Use a GitHub blob/raw URL to a .md file, or a tree URL to a skill folder",
  });
}

export function slugFromGithubUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());
    const parts = url.pathname.split("/").filter(Boolean);
    if (url.hostname === "raw.githubusercontent.com" && parts.length >= 4) {
      const file = parts[parts.length - 1] || "";
      if (/\.(md|mdc)$/i.test(file)) {
        const parent = parts[parts.length - 2];
        if (parent && !["main", "master"].includes(parent)) {
          return slugifyImportName(parent);
        }
        return slugifyImportName(file.replace(/\.(md|mdc)$/i, ""));
      }
      return slugifyImportName(parts[parts.length - 1] || "");
    }
    if (parts[2] === "blob" || parts[2] === "tree") {
      const rest = parts.slice(4);
      if (!rest.length) return null;
      const last = rest[rest.length - 1] || "";
      if (/\.(md|mdc)$/i.test(last) && rest.length >= 2) {
        return slugifyImportName(rest[rest.length - 2] || last);
      }
      return slugifyImportName(last.replace(/\.(md|mdc)$/i, ""));
    }
  } catch {
    return null;
  }
  return null;
}

function ensureImportableMarkdown(raw: string, fallbackSlug: string) {
  const parsed = matter(raw);
  const frontName = String(parsed.data.name || "").trim();
  const description = String(parsed.data.description || "")
    .replace(/\s+/g, " ")
    .trim();
  const body = String(parsed.content || "").trim();

  const slugCandidate = slugifyImportName(frontName || fallbackSlug);
  if (!isValidSkillName(slugCandidate)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Could not derive a valid slug. Pass slug explicitly (lowercase-hyphen).",
    });
  }

  // Already a proper catalog doc: commit as-is if description exists.
  if (description && body) {
    return {
      slug: slugCandidate,
      content: raw.trim().endsWith("\n") ? raw.trim() + "\n" : `${raw.trim()}\n`,
      name: frontName || slugCandidate,
      description,
    };
  }

  if (!body && !description) {
    throw createError({
      statusCode: 400,
      statusMessage: "Markdown is empty",
    });
  }

  const heading =
    body
      .split("\n")
      .find((line) => line.startsWith("# "))
      ?.replace(/^#\s+/, "")
      .trim() || slugCandidate;

  const content = buildCatalogMarkdown({
    name: slugCandidate,
    description: description || heading.slice(0, 280) || `Imported ${slugCandidate}`,
    body: body || raw.trim(),
    whenToUse:
      typeof parsed.data.whenToUse === "string"
        ? parsed.data.whenToUse
        : undefined,
    tags: Array.isArray(parsed.data.tags)
      ? parsed.data.tags.map(String)
      : undefined,
    draft: Boolean(parsed.data.draft),
    private: Boolean(parsed.data.private),
  });

  return {
    slug: slugCandidate,
    content,
    name: slugCandidate,
    description: description || heading.slice(0, 280),
  };
}

export async function commitImportedDoc(
  event: H3Event,
  input: {
    kind: CatalogKind;
    raw: string;
    slugHint: string;
    overwrite?: boolean;
  },
) {
  const prepared = ensureImportableMarkdown(input.raw, input.slugHint);
  const path = `${input.kind}/${prepared.slug}/${DOC_FILE[input.kind]}`;
  const sha = await getFileSha(event, path);

  if (sha && !input.overwrite) {
    throw createError({
      statusCode: 409,
      statusMessage: `${prepared.slug} already exists. Enable overwrite to replace.`,
    });
  }

  const result = await putCatalogFile(event, {
    path,
    content: prepared.content,
    message: sha
      ? `chore(${input.kind}): import overwrite ${prepared.slug}`
      : `feat(${input.kind}): import ${prepared.slug}`,
    sha,
  });

  return {
    kind: input.kind,
    slug: prepared.slug,
    name: prepared.name,
    description: prepared.description,
    path: result.path,
    htmlUrl: result.htmlUrl,
    previewPath: `/${input.kind}/${prepared.slug}?source=github`,
    overwritten: Boolean(sha),
    note: "Committed to GitHub. Use live preview while Coolify redeploys.",
  };
}

export async function fetchGithubMarkdown(url: string) {
  const rawUrl = githubUrlToRaw(url);
  const res = await fetch(rawUrl, {
    headers: {
      Accept: "text/plain",
      "User-Agent": "skills-erbilnas-com-import",
    },
  });
  if (!res.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to fetch GitHub file (${res.status})`,
    });
  }
  const text = await res.text();
  if (!text.trim()) {
    throw createError({ statusCode: 400, statusMessage: "Remote file is empty" });
  }
  return { rawUrl, text };
}
