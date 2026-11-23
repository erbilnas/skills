#!/usr/bin/env node
/**
 * Import MCP servers into ./mcps from:
 * - ~/.cursor/mcp.json (user)
 * - ~/.cursor/plugins/cache (plugin mcp.json files)
 * Secrets are redacted before write.
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scrubSecrets, slugify, transportOf } from "./lib/slug.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destRoot = join(root, "mcps");
const userMcpPath =
  process.env.MCP_SOURCE?.trim() || join(homedir(), ".cursor", "mcp.json");
const pluginsRoot = join(homedir(), ".cursor", "plugins", "cache");

async function walkMcpJson(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkMcpJson(full, out);
    } else if (entry.isFile() && entry.name === "mcp.json") {
      out.push(full);
    }
  }
  return out;
}

function describe(name, config) {
  const transport = transportOf(config);
  if (config.command) {
    const args = Array.isArray(config.args) ? config.args.join(" ") : "";
    return `${transport}: ${config.command}${args ? ` ${args}` : ""}`.trim();
  }
  if (config.url) {
    return `${transport}: ${config.url}`;
  }
  return `${transport} MCP server`;
}

function buildDoc({ slug, displayName, description, source, config }) {
  const transport = transportOf(config);
  const scrubbed = scrubSecrets(config);
  const body = [
    `# ${displayName}`,
    "",
    description,
    "",
    "## Config",
    "",
    "Secrets redacted.",
    "",
    "```json",
    JSON.stringify(scrubbed, null, 2),
    "```",
    "",
  ].join("\n");

  return `---
name: ${slug}
description: ${JSON.stringify(description)}
source: ${source}
transport: ${transport}
---

${body}`;
}

/** @type {Map<string, { slug: string, displayName: string, description: string, source: string, config: object }>} */
const servers = new Map();

function addServer(displayName, config, source) {
  const slug = slugify(displayName);
  if (!slug) return;
  // Prefer user-configured entries over plugin templates.
  if (servers.has(slug) && source !== "user") return;
  servers.set(slug, {
    slug,
    displayName,
    description: describe(displayName, config),
    source,
    config: config || {},
  });
}

async function loadUserMcps() {
  try {
    const raw = await readFile(userMcpPath, "utf8");
    const data = JSON.parse(raw);
    const map = data.mcpServers || {};
    for (const [name, config] of Object.entries(map)) {
      addServer(name, config, "user");
    }
  } catch (err) {
    if (err && err.code === "ENOENT") {
      console.warn(`No user MCP file at ${userMcpPath}`);
      return;
    }
    throw err;
  }
}

async function loadPluginMcps() {
  const files = await walkMcpJson(pluginsRoot);
  for (const file of files) {
    try {
      const data = JSON.parse(await readFile(file, "utf8"));
      const map = data.mcpServers || {};
      for (const [name, config] of Object.entries(map)) {
        addServer(name, config, "plugin");
      }
    } catch {
      // skip bad plugin manifests
    }
  }
}

await rm(destRoot, { recursive: true, force: true });
await mkdir(destRoot, { recursive: true });
await loadUserMcps();
await loadPluginMcps();

for (const entry of servers.values()) {
  const dir = join(destRoot, entry.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "MCP.md"), buildDoc(entry), "utf8");
  console.log(`+ ${entry.slug} (${entry.source})`);
}

console.log(`\nImported ${servers.size} MCP(s) → ${destRoot}`);
