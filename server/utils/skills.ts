import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export interface SkillMeta {
  slug: string;
  name: string;
  description: string;
  category: string | null;
  path: string;
  updatedAt: string | null;
}

export interface SkillDetail extends SkillMeta {
  body: string;
  html: string;
  raw: string;
}

const SKIP_DIRS = new Set([".DS_Store", "node_modules", ".git"]);

function skillsRoot() {
  return join(process.cwd(), "skills");
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

export function renderSkillHtml(markdown: string) {
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

async function walkSkillFiles(dir: string, out: string[] = []) {
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
      await walkSkillFiles(full, out);
    } else if (entry.isFile() && entry.name === "SKILL.md") {
      out.push(full);
    }
  }
  return out;
}

function parseSkillFile(
  filePath: string,
  root: string,
  raw: string,
  mtimeMs: number | null,
): SkillDetail {
  const parsed = matter(raw);
  const relDir = relative(root, join(filePath, ".."));
  const slug = toSlug(relDir);
  const folderName = slug.split("/").pop() || slug;
  const name = sanitizeName(parsed.data.name, folderName);
  const description = sanitizeDescription(parsed.data.description);
  const body = String(parsed.content || "").trim();

  return {
    slug,
    name,
    description,
    category: categoryFromRel(relDir),
    path: `skills/${slug}/SKILL.md`,
    updatedAt: mtimeMs ? new Date(mtimeMs).toISOString() : null,
    body,
    html: renderSkillHtml(body),
    raw,
  };
}

export async function listSkills(): Promise<SkillMeta[]> {
  const root = skillsRoot();
  const files = await walkSkillFiles(root);
  const skills: SkillMeta[] = [];

  for (const file of files) {
    try {
      const [raw, info] = await Promise.all([
        readFile(file, "utf8"),
        stat(file),
      ]);
      const detail = parseSkillFile(file, root, raw, info.mtimeMs);
      skills.push({
        slug: detail.slug,
        name: detail.name,
        description: detail.description,
        category: detail.category,
        path: detail.path,
        updatedAt: detail.updatedAt,
      });
    } catch {
      // Skip unreadable / malformed files rather than failing the catalog.
    }
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));
  return skills;
}

export async function getSkill(slug: string): Promise<SkillDetail | null> {
  const normalized = slug
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
  if (!normalized || normalized.includes("..")) {
    return null;
  }

  const file = join(skillsRoot(), ...normalized.split("/"), "SKILL.md");
  try {
    const [raw, info] = await Promise.all([
      readFile(file, "utf8"),
      stat(file),
    ]);
    return parseSkillFile(file, skillsRoot(), raw, info.mtimeMs);
  } catch {
    return null;
  }
}

export function isValidSkillName(name: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) && name.length <= 64;
}

export function buildSkillMarkdown(input: {
  name: string;
  description: string;
  body: string;
}) {
  const description = input.description.trim();
  const body = input.body.trim();
  return `---\nname: ${input.name}\ndescription: ${JSON.stringify(description)}\n---\n\n${body}\n`;
}
