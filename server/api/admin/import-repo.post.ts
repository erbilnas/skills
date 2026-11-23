import type { CatalogKind } from "../../utils/catalog";
import {
  commitImportedDoc,
  inferKindFromFilename,
  slugifyImportName,
} from "../../utils/import-doc";
import { fetchRawGithubFile, listRepoDocPaths } from "../../utils/github-contents";

const KINDS = new Set<CatalogKind>(["skills", "mcps", "rules"]);

function parseRepoUrl(input: string) {
  const url = new URL(input.trim());
  if (!["github.com", "www.github.com"].includes(url.hostname)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Only github.com repository URLs are allowed",
    });
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw createError({ statusCode: 400, statusMessage: "Invalid repo URL" });
  }
  const [owner, repo, maybeType, maybeRef, ...rest] = parts;
  let ref = "main";
  let prefix = "";
  if (maybeType === "tree" && maybeRef) {
    ref = maybeRef;
    prefix = rest.join("/");
  } else if (maybeType === "blob" && maybeRef) {
    ref = maybeRef;
    prefix = rest.slice(0, -1).join("/");
  }
  return { owner: owner!, repo: repo!, ref, prefix };
}

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);

  const body = await readBody<{
    url?: string;
    kind?: string;
    overwrite?: boolean;
    limit?: number;
  }>(event);

  const url = String(body?.url || "").trim();
  if (!url) {
    throw createError({ statusCode: 400, statusMessage: "URL required" });
  }

  const { owner, repo, ref, prefix } = parseRepoUrl(url);
  const paths = await listRepoDocPaths(event, { owner, repo, ref, prefix });
  const limit = Math.min(Number(body?.limit) || 50, 100);
  const selected = paths.slice(0, limit);

  const kindOverride = String(body?.kind || "").trim();
  const committed: Array<{ slug: string; kind: string; path: string }> = [];
  const errors: Array<{ path: string; error: string }> = [];

  for (const path of selected) {
    try {
      const raw = await fetchRawGithubFile(event, { owner, repo, ref, path });
      if (!raw) {
        errors.push({ path, error: "empty or missing" });
        continue;
      }
      const kind = (
        KINDS.has(kindOverride as CatalogKind)
          ? kindOverride
          : inferKindFromFilename(path)
      ) as CatalogKind;
      const parts = path.split("/");
      const parent = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
      const result = await commitImportedDoc(event, {
        kind,
        raw,
        slugHint: slugifyImportName(parent || "imported"),
        overwrite: Boolean(body?.overwrite),
      });
      committed.push({ slug: result.slug, kind: result.kind, path });
    } catch (err: unknown) {
      const fetchErr = err as { statusMessage?: string; message?: string };
      errors.push({
        path,
        error: fetchErr.statusMessage || fetchErr.message || "failed",
      });
    }
  }

  await appendAudit(event, {
    action: "import-repo",
    detail: `${committed.length} imported from ${owner}/${repo}`,
  });

  return {
    source: `${owner}/${repo}@${ref}${prefix ? `/${prefix}` : ""}`,
    found: paths.length,
    imported: committed.length,
    committed,
    errors,
    note: "Imported matching docs and committed to GitHub.",
  };
});
