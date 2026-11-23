import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export type CatalogKind = "skills" | "mcps" | "rules";

export interface CatalogMeta {
  slug: string;
  name: string;
  description: string;
  whenToUse: string | null;
  category: string | null;
  tags: string[];
  path: string;
  updatedAt: string | null;
  draft: boolean;
  private: boolean;
  source?: string | null;
  transport?: string | null;
  alwaysApply?: boolean | null;
}

export interface CatalogDetail extends CatalogMeta {
  body: string;
  html: string;
  raw: string;
}

const SKIP_DIRS = new Set([".DS_Store", "node_modules", ".git"]);

export const DOC_FILE: Record<CatalogKind, string> = {
  skills: "SKILL.md",
  mcps: "MCP.md",
  rules: "RULE.md",
};

const TAG_RULES: Array<{ tag: string; pattern: RegExp }> = [
  { tag: "design", pattern: /\b(design|ui|ux|visual|slop|taste|shadow|typography|animation|motion|css|tailwind|daisy|shadcn|figma|apple)\b/i },
  { tag: "testing", pattern: /\b(test|tdd|gherkin|playwright|qa|spec)\b/i },
  { tag: "git", pattern: /\b(git|commit|pr|pull request|github|merge)\b/i },
  { tag: "security", pattern: /\b(secur|oauth|auth|secret|owasp|devsecops)\b/i },
  { tag: "docs", pattern: /\b(doc|writing|copy|humaniz|markdown|readme)\b/i },
  { tag: "debugging", pattern: /\b(debug|diagnos|bug|sentry|triage)\b/i },
  { tag: "architecture", pattern: /\b(architect|domain|codebase|refactor|spec)\b/i },
  { tag: "frontend", pattern: /\b(react|vue|nuxt|next|frontend|component)\b/i },
  { tag: "devops", pattern: /\b(deploy|docker|ci|cloudflare|vercel|wrangler)\b/i },
  { tag: "agents", pattern: /\b(agent|skill|mcp|prompt|cursor|claude)\b/i },
];

function catalogRoot(kind: CatalogKind) {
  return join(process.cwd(), kind);
}

function toSlug(relDir: string) {
  return relDir.split(sep).join("/");
}

function categoryFromRel(relDir: string): string | null {
  const parts = relDir.split(sep).filter(Boolean);
  if (parts.length >= 2) {
    return parts[0] ?? null;
  }
  return null;
}

function sanitizeName(value: unknown, fallback: string) {
  const raw = String(value ?? "").trim();
  return raw || fallback;
}

function sanitizeDescription(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .map((item) => String(item || "").trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
  }
  if (typeof value === "string" && value.trim()) {
    return [
      ...new Set(
        value
          .split(/[,|]/)
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
  }
  return [];
}

function inferTags(name: string, description: string, category: string | null) {
  const hay = `${name} ${description} ${category || ""}`;
  const tags = new Set<string>();
  for (const rule of TAG_RULES) {
    if (rule.pattern.test(hay)) tags.add(rule.tag);
  }
  if (category) tags.add(category.toLowerCase());
  return [...tags].sort((a, b) => a.localeCompare(b));
}

export function renderMarkdownHtml(markdown: string) {
  const html = marked.parse(markdown, { async: false }) as string;
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title"],
      a: ["href", "name", "target", "rel"],
      code: ["class"],
      pre: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
        target: "_blank",
      }),
    },
  });
}

async function walkDocFiles(
  dir: string,
  docName: string,
  out: string[] = [],
) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? err.code : "";
    if (code === "ENOENT") {
      return out;
    }
    throw err;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDocFiles(full, docName, out);
    } else if (entry.isFile() && entry.name === docName) {
      out.push(full);
    }
  }
  return out;
}

function parseDocFile(
  kind: CatalogKind,
  filePath: string,
  root: string,
  raw: string,
  mtimeMs: number | null,
): CatalogDetail {
  const parsed = matter(raw);
  const relDir = relative(root, join(filePath, ".."));
  const slug = toSlug(relDir);
  const folderName = slug.split("/").pop() || slug;
  const name = sanitizeName(parsed.data.name, folderName);
  const description = sanitizeDescription(parsed.data.description);
  const whenToUse = sanitizeDescription(
    parsed.data.whenToUse || parsed.data["when-to-use"] || "",
  ) || null;
  const body = String(parsed.content || "").trim();
  const source =
    typeof parsed.data.source === "string" ? parsed.data.source : null;
  const transport =
    typeof parsed.data.transport === "string" ? parsed.data.transport : null;
  const alwaysApply =
    typeof parsed.data.alwaysApply === "boolean"
      ? parsed.data.alwaysApply
      : null;
  const category = categoryFromRel(relDir) || source;
  const explicitTags = parseTags(parsed.data.tags);
  const tags =
    explicitTags.length > 0
      ? explicitTags
      : inferTags(name, description, category);
  const draft = Boolean(parsed.data.draft);
  const isPrivate = Boolean(parsed.data.private || parsed.data.hidden);

  return {
    slug,
    name,
    description,
    whenToUse,
    category,
    tags,
    path: `${kind}/${slug}/${DOC_FILE[kind]}`,
    updatedAt: mtimeMs ? new Date(mtimeMs).toISOString() : null,
    draft,
    private: isPrivate,
    source,
    transport,
    alwaysApply,
    body,
    html: renderMarkdownHtml(body),
    raw,
  };
}

function toMeta(detail: CatalogDetail): CatalogMeta {
  return {
    slug: detail.slug,
    name: detail.name,
    description: detail.description,
    whenToUse: detail.whenToUse,
    category: detail.category,
    tags: detail.tags,
    path: detail.path,
    updatedAt: detail.updatedAt,
    draft: detail.draft,
    private: detail.private,
    source: detail.source,
    transport: detail.transport,
    alwaysApply: detail.alwaysApply,
  };
}

export function isPublicItem(item: Pick<CatalogMeta, "draft" | "private">) {
  return !item.draft && !item.private;
}

export type CatalogSort = "name" | "updated";

export function sortCatalog(
  items: CatalogMeta[],
  sort: CatalogSort = "name",
): CatalogMeta[] {
  const copy = [...items];
  if (sort === "updated") {
    copy.sort((a, b) => {
      const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      if (bTime !== aTime) return bTime - aTime;
      return a.name.localeCompare(b.name);
    });
    return copy;
  }
  copy.sort((a, b) => a.name.localeCompare(b.name));
  return copy;
}

export async function listCatalog(
  kind: CatalogKind,
  options: { includeHidden?: boolean; sort?: CatalogSort } = {},
): Promise<CatalogMeta[]> {
  const root = catalogRoot(kind);
  const files = await walkDocFiles(root, DOC_FILE[kind]);
  const items: CatalogMeta[] = [];

  for (const file of files) {
    try {
      const [raw, info] = await Promise.all([
        readFile(file, "utf8"),
        stat(file),
      ]);
      const detail = parseDocFile(kind, file, root, raw, info.mtimeMs);
      if (!options.includeHidden && !isPublicItem(detail)) continue;
      items.push(toMeta(detail));
    } catch {
      // Skip unreadable / malformed files.
    }
  }

  return sortCatalog(items, options.sort || "name");
}

export async function getCatalogItem(
  kind: CatalogKind,
  slug: string,
  options: { includeHidden?: boolean } = {},
): Promise<CatalogDetail | null> {
  const normalized = slug
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
  if (!normalized || normalized.includes("..")) {
    return null;
  }

  const file = join(
    catalogRoot(kind),
    ...normalized.split("/"),
    DOC_FILE[kind],
  );
  try {
    const [raw, info] = await Promise.all([
      readFile(file, "utf8"),
      stat(file),
    ]);
    const detail = parseDocFile(kind, file, catalogRoot(kind), raw, info.mtimeMs);
    if (!options.includeHidden && !isPublicItem(detail)) {
      return null;
    }
    return detail;
  } catch {
    return null;
  }
}

export function relatedItems(
  item: CatalogMeta,
  pool: CatalogMeta[],
  limit = 6,
): CatalogMeta[] {
  const tags = new Set(item.tags);
  return pool
    .filter((candidate) => candidate.slug !== item.slug)
    .map((candidate) => {
      const overlap = candidate.tags.filter((tag) => tags.has(tag)).length;
      const sameCategory =
        item.category && candidate.category === item.category ? 1 : 0;
      return { candidate, score: overlap * 2 + sameCategory };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name))
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export function catalogListPayload(
  kind: CatalogKind,
  items: CatalogMeta[],
) {
  const categories = [
    ...new Set(
      items
        .map((item) => item.category)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const tags = [
    ...new Set(items.flatMap((item) => item.tags)),
  ].sort((a, b) => a.localeCompare(b));

  const recent = sortCatalog(items, "updated").slice(0, 8);

  return {
    kind,
    count: items.length,
    categories,
    tags,
    recent,
    items,
  };
}

export function buildCatalogMarkdown(input: {
  name: string;
  description: string;
  body: string;
  whenToUse?: string;
  tags?: string[];
  draft?: boolean;
  private?: boolean;
  source?: string;
  transport?: string;
  alwaysApply?: boolean;
}) {
  const lines = [
    "---",
    `name: ${input.name}`,
    `description: ${JSON.stringify(input.description.trim())}`,
  ];
  if (input.whenToUse?.trim()) {
    lines.push(`whenToUse: ${JSON.stringify(input.whenToUse.trim())}`);
  }
  if (input.tags?.length) {
    lines.push(`tags: [${input.tags.map((tag) => JSON.stringify(tag)).join(", ")}]`);
  }
  if (input.draft) lines.push("draft: true");
  if (input.private) lines.push("private: true");
  if (input.source) lines.push(`source: ${input.source}`);
  if (input.transport) lines.push(`transport: ${input.transport}`);
  if (typeof input.alwaysApply === "boolean") {
    lines.push(`alwaysApply: ${input.alwaysApply}`);
  }
  lines.push("---", "", input.body.trim(), "");
  return lines.join("\n");
}

export function parseCatalogFromRaw(
  kind: CatalogKind,
  slug: string,
  raw: string,
  updatedAt: string | null = null,
): CatalogDetail {
  const fakeRoot = catalogRoot(kind);
  const fakePath = join(fakeRoot, ...slug.split("/"), DOC_FILE[kind]);
  return parseDocFile(
    kind,
    fakePath,
    fakeRoot,
    raw,
    updatedAt ? Date.parse(updatedAt) : null,
  );
}
