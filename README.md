# skills.erbilnas.com

Public catalog of agent skills (`SKILL.md`) with GitHub OAuth admin to commit new ones.

## Stack

- Nuxt 4 + Nitro + Bun
- Tailwind CSS + color mode
- Coolify / Docker on Hetzner (same pattern as `erbilnas.com`)

## Local

```bash
bun install
bun run import-skills   # copies ~/.agents/skills → ./skills
bun run dev
```

Override import source:

```bash
SKILLS_SOURCE=/path/to/skills bun run import-skills
```

## Admin

1. Create a GitHub OAuth App
   - Homepage: `https://skills.erbilnas.com`
   - Callback: `https://skills.erbilnas.com/api/admin/auth/callback`
2. Create a fine-grained PAT (or classic token) with **Contents: Read and write** on this repo
3. Set env vars from `.env.example`

OAuth identifies the allowlisted user (`ADMIN_GITHUB_LOGIN`). Commits use `GITHUB_TOKEN`.

## Deploy (Coolify)

1. Push this repo to GitHub
2. New Coolify Docker app from the repo (`Dockerfile`)
3. Domain: `skills.erbilnas.com`
4. Paste env vars from `.env.example`
5. Enable auto-deploy on push so admin commits show up after rebuild

## Routes

- `/` catalog search
- `/skills/:slug` skill detail
- `/admin` create / edit (GitHub login)
