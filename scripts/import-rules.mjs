#!/usr/bin/env node
/**
 * Import Cursor rules into ./rules from:
 * - scripts/data/user-rules.json + markdown bodies (exported user rules)
 * - ~/.cursor/plugins/cache rules folders (plugin .mdc files)
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "./lib/slug.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destRoot = join(root, "rules");
const metaPath = join(root, "scripts/data/user-rules.json");
const bodiesDir = join(root, "scripts/data/user-rules");
const pluginsRoot = join(homedir(), ".cursor", "plugins", "cache");

function parseMdc(raw) {
  if (!raw.startsWith("---")) {
    return { data: {}, body: raw };
  }
  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    return { data: {}, body: raw };
  }
  const fm = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\n/, "");
  const data = {};
  for (const line of fm.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, body };
}

function firstDescription(body, fallback = "") {
  for (const line of String(body || "").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("---") || t.startsWith("<!--")) {
      continue;
    }
    return t.replace(/\s+/g, " ").slice(0, 240);
  }
  return fallback;
}

function buildDoc({ slug, name, description, source, alwaysApply, body }) {
  return `---
name: ${slug}
description: ${JSON.stringify(description)}
source: ${source}
alwaysApply: ${alwaysApply ? "true" : "false"}
---

${body.trim()}\n`;
}

/** @type {Map<string, object>} */
const rules = new Map();

function addRule(entry) {
  if (!entry.slug) return;
  if (rules.has(entry.slug) && entry.source !== "user") return;
  rules.set(entry.slug, entry);
}

async function loadUserRules() {
  let meta;
  try {
    meta = JSON.parse(await readFile(metaPath, "utf8"));
  } catch (err) {
    if (err && err.code === "ENOENT") {
      console.warn(`No user rules meta at ${metaPath}`);
      return;
    }
    throw err;
  }

  for (const item of meta) {
    const slug = slugify(item.slug || item.title);
    const bodyPath = join(bodiesDir, item.contentPath || `${slug}.md`);
    let body = "";
    try {
      body = await readFile(bodyPath, "utf8");
    } catch {
      console.warn(`Missing body for ${slug}`);
      continue;
    }
    addRule({
      slug,
      name: item.title || slug,
      description: item.description || firstDescription(body),
      source: "user",
      alwaysApply: Boolean(item.alwaysApply),
      body,
    });
  }
}

async function walk(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

async function loadPluginRules() {
  const files = await walk(pluginsRoot);
  for (const file of files) {
    if (!file.endsWith(".mdc")) continue;
    const parts = file.split("/");
    const rulesIdx = parts.lastIndexOf("rules");
    // Only `.../rules/<name>.mdc` (not nested reference docs).
    if (rulesIdx === -1 || parts.length - rulesIdx !== 2) continue;

    try {
      const raw = await readFile(file, "utf8");
      const { data, body } = parseMdc(raw);
      const base = basename(file, ".mdc");
      const slug = slugify(base);
      const description =
        typeof data.description === "string" && data.description
          ? data.description
          : firstDescription(body, `Plugin rule ${base}`);
      addRule({
        slug,
        name: base,
        description,
        source: "plugin",
        alwaysApply: Boolean(data.alwaysApply),
        body: body || raw,
      });
    } catch {
      // skip
    }
  }
}

await rm(destRoot, { recursive: true, force: true });
await mkdir(destRoot, { recursive: true });
await loadUserRules();
await loadPluginRules();

for (const entry of rules.values()) {
  const dir = join(destRoot, entry.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "RULE.md"), buildDoc(entry), "utf8");
  console.log(`+ ${entry.slug} (${entry.source})`);
}

console.log(`\nImported ${rules.size} rule(s) → ${destRoot}`);
