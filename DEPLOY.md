# Deploy skills.erbilnas.com

## 1. GitHub OAuth App

Create at https://github.com/settings/developers → OAuth Apps → New

| Field | Value |
| --- | --- |
| Application name | skills.erbilnas.com |
| Homepage URL | `https://skills.erbilnas.com` |
| Authorization callback URL | `https://skills.erbilnas.com/api/admin/auth/callback` |

Copy Client ID and Client Secret into Coolify env.

## 2. GitHub token (write skills)

Create a fine-grained personal access token with access to this repo only:

- **Contents**: Read and write

Set as `GITHUB_TOKEN`.

## 3. Coolify

1. Open `https://coolify.erbilnas.com`
2. New Resource → Docker Compose / Dockerfile (this repo)
3. Domain: `skills.erbilnas.com`
4. Build pack: Dockerfile
5. Enable auto-deploy on push to `main`
6. Environment variables:

```bash
NUXT_APP_URL=https://skills.erbilnas.com
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
ADMIN_SESSION_SECRET=<long-random-string>
ADMIN_GITHUB_LOGIN=erbilnas
GITHUB_USERNAME=erbilnas
GITHUB_TOKEN=...
GITHUB_REPO=erbilnas/skills
GITHUB_BRANCH=main
```

Generate a session secret:

```bash
openssl rand -base64 32
```

## 4. DNS

Point `skills.erbilnas.com` at the same Coolify proxy used by other `*.erbilnas.com` hosts (CNAME or A record matching `erbilnas.com` / `baklavue.erbilnas.com`).

## 5. Verify

1. `https://skills.erbilnas.com` lists skills
2. `/admin` → Continue with GitHub → allowlisted login only
3. Commit a new skill → appears in the GitHub repo → Coolify redeploy picks it up
