# Skills by Erbil Nas

Public catalog of agent **skills**, **MCPs**, **Cursor rules**, and curated **sets**. Browse on the web, copy an install line, or hit a light search API from an agent.

**Live:** [skills.erbilnas.com](https://skills.erbilnas.com)

## Install a skill

```bash
npx skills add erbilnas/skills/<slug>
```

Example:

```bash
npx skills add erbilnas/skills/writing-for-agents
```

Sets have a **Copy all** block that lists one install line per skill.

## What’s in the repo

| Path | What |
| --- | --- |
| `skills/*/SKILL.md` | Agent skills |
| `mcps/*/MCP.md` | MCP docs (secrets redacted on import) |
| `rules/*/RULE.md` | Cursor rules |
| `sets/*/SET.md` | Named packs that point at skills |
| `app/` + `server/` | Nuxt 4 catalog + admin API |
| `scripts/` | Import / check helpers |

Content lives in Git. The admin UI commits through the GitHub Contents API; Coolify redeploys on push so the public site catches up.

## Public routes

| Route | Purpose |
| --- | --- |
| `/` | Skill catalog (search, tags, sort) |
| `/sets`, `/sets/:slug` | Packs + install-all |
| `/mcps`, `/rules` | MCP and rule catalogs |
| `/skills/:slug` | Detail, install, changelog, related / used-with |
| `/starred` | Personal pins (browser cookie) |
| `/api/search?q=` | JSON search for agents |
| `/api/sitemap.xml` | Sitemap |
| `/api/feed.xml`, `/api/feed.json` | Feeds |

After an admin commit, if Coolify is still rebuilding, open `?source=github` on a detail page for a live GitHub preview.

## Local development

Needs [Bun](https://bun.sh).

```bash
bun install
bun run import-all   # optional: refresh from local Cursor / agents folders
bun run dev
```

Imports:

```bash
bun run import-skills   # ~/.agents/skills → ./skills
bun run import-mcps     # ~/.cursor/mcp.json + plugins → ./mcps
bun run import-rules    # user rules + plugin .mdc → ./rules
bun run check           # structure + secret scan
```

Override the skills source:

```bash
SKILLS_SOURCE=/path/to/skills bun run import-skills
```

Copy `.env.example` → `.env` when you need admin or GitHub preview locally.

## Admin

Allowlisted GitHub OAuth for the browser; writes use `GITHUB_TOKEN`.

1. Create a GitHub OAuth App  
   - Homepage: `https://skills.erbilnas.com`  
   - Callback: `https://skills.erbilnas.com/api/admin/auth/callback`
2. Create a fine-grained PAT with **Contents: Read and write** on this repo
3. Fill env from `.env.example` (`ADMIN_GITHUB_LOGIN` is the only login that can enter)

Admin can create/edit catalog items, flip draft/live on list rows, import a whole GitHub repo/folder, soft-delete to trash (with undo), and browse the audit log.

## Deploy

Docker image from the root `Dockerfile`. Full Coolify + DNS steps: [DEPLOY.md](./DEPLOY.md).

Required env (summary):

```bash
NUXT_APP_URL=https://skills.erbilnas.com
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
ADMIN_SESSION_SECRET=   # openssl rand -base64 32
ADMIN_GITHUB_LOGIN=
GITHUB_USERNAME=
GITHUB_TOKEN=
GITHUB_REPO=erbilnas/skills
GITHUB_BRANCH=main
```

Enable auto-deploy on `main` so admin commits show up after rebuild.

## Stack

Nuxt 4, Nitro, Bun, Tailwind, color mode. Markdown via gray-matter + marked + sanitize-html.

## License

Catalog content and site code are published as-is for personal / portfolio use unless noted in a skill’s own file.