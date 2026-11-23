#!/usr/bin/env node
/** ponytail: O(n) filesystem scan check; upgrade to vitest if assertions grow. */
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "skills");

async function walk(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (entry.name === "SKILL.md") out.push(full);
  }
  return out;
}

const files = await walk(root);
if (files.length < 1) {
  console.error("FAIL: no SKILL.md files under ./skills");
  process.exit(1);
}

let ok = 0;
for (const file of files) {
  const raw = await readFile(file, "utf8");
  const parsed = matter(raw);
  const name = String(parsed.data.name || "").trim();
  if (!name) {
    console.error(`FAIL: missing name frontmatter in ${file}`);
    process.exit(1);
  }
  await stat(file);
  ok += 1;
}

console.log(`ok: ${ok} skills parse`);
