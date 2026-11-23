import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";

export interface SkillSetMeta {
  slug: string;
  name: string;
  description: string;
  skills: string[];
  path: string;
  updatedAt: string | null;
  draft: boolean;
  private: boolean;
}

export interface SkillSetDetail extends SkillSetMeta {
  body: string;
  raw: string;
}

const SET_FILE = "SET.md";

function setsRoot() {
  return join(process.cwd(), "sets");
}

function parseSkills(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,|\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function buildSetMarkdown(input: {
  name: string;
  description: string;
  skills: string[];
  body?: string;
  draft?: boolean;
  private?: boolean;
}) {
  const lines = [
    "---",
    `name: ${input.name}`,
    `description: ${JSON.stringify(input.description.trim())}`,
    "skills:",
    ...input.skills.map((slug) => `  - ${slug}`),
  ];
  if (input.draft) lines.push("draft: true");
  if (input.private) lines.push("private: true");
  lines.push("---", "", (input.body || "").trim(), "");
  return lines.join("\n");
}

function parseSetFile(
  slug: string,
  raw: string,
  mtimeMs: number | null,
): SkillSetDetail {
  const parsed = matter(raw);
  const name = String(parsed.data.name || slug).trim() || slug;
  const description = String(parsed.data.description || "")
    .replace(/\s+/g, " ")
    .trim();
  const skills = parseSkills(parsed.data.skills);
  const draft = Boolean(parsed.data.draft);
  const isPrivate = Boolean(parsed.data.private || parsed.data.hidden);

  return {
    slug,
    name,
    description,
    skills,
    path: `sets/${slug}/${SET_FILE}`,
    updatedAt: mtimeMs ? new Date(mtimeMs).toISOString() : null,
    draft,
    private: isPrivate,
    body: String(parsed.content || "").trim(),
    raw,
  };
}

function toMeta(detail: SkillSetDetail): SkillSetMeta {
  return {
    slug: detail.slug,
    name: detail.name,
    description: detail.description,
    skills: detail.skills,
    path: detail.path,
    updatedAt: detail.updatedAt,
    draft: detail.draft,
    private: detail.private,
  };
}

export function isPublicSet(item: Pick<SkillSetMeta, "draft" | "private">) {
  return !item.draft && !item.private;
}

export async function listSets(
  options: { includeHidden?: boolean } = {},
): Promise<SkillSetMeta[]> {
  const root = setsRoot();
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? err.code : "";
    if (code === "ENOENT") return [];
    throw err;
  }

  const items: SkillSetMeta[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const file = join(root, entry.name, SET_FILE);
    try {
      const [raw, info] = await Promise.all([
        readFile(file, "utf8"),
        stat(file),
      ]);
      const detail = parseSetFile(entry.name, raw, info.mtimeMs);
      if (!options.includeHidden && !isPublicSet(detail)) continue;
      items.push(toMeta(detail));
    } catch {
      // skip malformed
    }
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

export async function getSet(
  slug: string,
  options: { includeHidden?: boolean } = {},
): Promise<SkillSetDetail | null> {
  const normalized = slug
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
  if (!normalized || normalized.includes("..") || normalized.includes("/")) {
    return null;
  }

  const file = join(setsRoot(), normalized, SET_FILE);
  try {
    const [raw, info] = await Promise.all([
      readFile(file, "utf8"),
      stat(file),
    ]);
    const detail = parseSetFile(normalized, raw, info.mtimeMs);
    if (!options.includeHidden && !isPublicSet(detail)) return null;
    return detail;
  } catch {
    return null;
  }
}

export function parseSetFromRaw(
  slug: string,
  raw: string,
  updatedAt: string | null = null,
): SkillSetDetail {
  return parseSetFile(
    slug,
    raw,
    updatedAt ? Date.parse(updatedAt) : null,
  );
}
