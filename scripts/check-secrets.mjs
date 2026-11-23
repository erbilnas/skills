#!/usr/bin/env node
/** Fail if published catalog markdown still contains credential-shaped values. */
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dirs = ["mcps", "rules", "skills"];

const FORBIDDEN_KEY_LINE =
  /^\s*"(CLIENT_ID|CLIENT_SECRET|API_KEY|ACCESS_TOKEN|REFRESH_TOKEN|AUTHORIZATION|PASSWORD|SECRET|TOKEN)"\s*:\s*"(?!\*\*\*)[^"]+"/im;

const FORBIDDEN_VALUE =
  /"(CLIENT_ID|CLIENT_SECRET|API_KEY|ACCESS_TOKEN|REFRESH_TOKEN|TOKEN|PASSWORD|SECRET)"\s*:\s*"(?!\*\*\*)[^"]{3,}"/gi;

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
    else if (/\.(md|json)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

const hits = [];
for (const name of dirs) {
  const files = await walk(join(root, name));
  for (const file of files) {
    // Source snapshots under scripts/data are not public runtime content.
    if (file.includes("/scripts/")) continue;
    const text = await readFile(file, "utf8");
    if (FORBIDDEN_KEY_LINE.test(text) || FORBIDDEN_VALUE.test(text)) {
      hits.push(file);
    }
    // Raw-looking client ids still present after a key
    if (/CLIENT_ID"\s*:\s*"[^*"][^"]+"/i.test(text)) {
      hits.push(file);
    }
  }
}

const unique = [...new Set(hits)];
if (unique.length) {
  console.error("FAIL: possible secrets still published:");
  for (const file of unique) console.error(` - ${file}`);
  process.exit(1);
}

console.log("ok: no credential values found in public catalog files");
