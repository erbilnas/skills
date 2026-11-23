#!/usr/bin/env node
/**
 * Copy Agent Skills from a source tree into ./skills for the catalog.
 * Default source: ~/.agents/skills
 * Override: SKILLS_SOURCE=/path/to/skills
 */
import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destRoot = join(root, "skills");
const sourceRoot =
  process.env.SKILLS_SOURCE?.trim() || join(homedir(), ".agents", "skills");

const SKIP = new Set([".DS_Store", "node_modules", ".git"]);

async function findSkillDirs(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err && err.code === "ENOENT") {
      console.error(`Source not found: ${sourceRoot}`);
      process.exit(1);
    }
    throw err;
  }

  for (const entry of entries) {
    if (SKIP.has(entry.name) || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await findSkillDirs(full, out);
    } else if (entry.isFile() && entry.name === "SKILL.md") {
      out.push(dirname(full));
    }
  }
  return out;
}

async function copySkillDir(skillDir) {
  const rel = relative(sourceRoot, skillDir);
  const dest = join(destRoot, rel);
  await mkdir(dest, { recursive: true });

  const entries = await readdir(skillDir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const from = join(skillDir, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) {
      await cp(from, to, { recursive: true });
    } else if (entry.isFile()) {
      await cp(from, to);
    }
  }
  return rel;
}

const skillDirs = await findSkillDirs(sourceRoot);
await mkdir(destRoot, { recursive: true });

let copied = 0;
for (const dir of skillDirs) {
  const rel = await copySkillDir(dir);
  console.log(`+ ${rel}`);
  copied += 1;
}

const destStat = await stat(destRoot);
console.log(
  `\nImported ${copied} skill(s) from ${sourceRoot} → ${destRoot} (${destStat.isDirectory() ? "ok" : "missing"})`,
);
