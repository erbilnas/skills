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
  category: string | null;
  path: string;
  updatedAt: string | null;
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

const DOC_FILE: Record<CatalogKind, string> = {
  skills: "SKILL.md",
  mcps: "MCP.md",
  rules: "RULE.md",
};

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
  const body = String(parsed.content || "").trim();
  const source =
    typeof parsed.data.source === "string" ? parsed.data.source : null;
  const transport =
    typeof parsed.data.transport === "string" ? parsed.data.transport : null;
  const alwaysApply =
    typeof parsed.data.alwaysApply === "boolean"
      ? parsed.data.alwaysApply
      : null;

  return {
    slug,
    name,
    description,
    category: categoryFromRel(relDir) || source,
    path: `${kind}/${slug}/${DOC_FILE[kind]}`,
    updatedAt: mtimeMs ? new Date(mtimeMs).toISOString() : null,
    source,
    transport,
    alwaysApply,
    body,
    html: renderMarkdownHtml(body),
    raw,
  };
}

export async function listCatalog(kind: CatalogKind): Promise<CatalogMeta[]> {
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
      items.push({
        slug: detail.slug,
        name: detail.name,
        description: detail.description,
        category: detail.category,
        path: detail.path,
        updatedAt: detail.updatedAt,
        source: detail.source,
        transport: detail.transport,
        alwaysApply: detail.alwaysApply,
      });
    } catch {
      // Skip unreadable / malformed files.
    }
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

export async function getCatalogItem(
  kind: CatalogKind,
  slug: string,
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
    return parseDocFile(kind, file, catalogRoot(kind), raw, info.mtimeMs);
  } catch {
    return null;
  }
}

export function catalogListPayload(kind: CatalogKind, items: CatalogMeta[]) {
  const categories = [
    ...new Set(
      items
        .map((item) => item.category)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  return {
    kind,
    count: items.length,
    categories,
    items,
  };
}
