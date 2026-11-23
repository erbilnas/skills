import type { CatalogKind } from "../../../utils/catalog";

const KINDS = new Set<CatalogKind>(["skills", "mcps", "rules"]);

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);

  const body = await readBody<{
    kind?: string;
    slug?: string;
    id?: string;
  }>(event);

  const kind = String(body?.kind || "");
  const slug = String(body?.slug || "").trim();
  const id = String(body?.id || "").trim();

  if (!KINDS.has(kind as CatalogKind) || !slug || !id) {
    throw createError({ statusCode: 400, statusMessage: "kind, slug, and id required" });
  }

  const result = await restoreTrashItem(event, {
    kind: kind as CatalogKind,
    slug,
    id,
  });

  await appendAudit(event, {
    action: "restore",
    kind,
    slug,
    detail: id,
  });

  return {
    ...result,
    note: "Restored from trash on GitHub.",
  };
});
