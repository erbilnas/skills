import type { CatalogKind } from "../../../../../utils/catalog";

const KINDS = new Set<CatalogKind>(["skills", "mcps", "rules"]);

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);

  const kindParam = String(getRouterParam(event, "kind") || "");
  if (!KINDS.has(kindParam as CatalogKind)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid kind" });
  }
  const kind = kindParam as CatalogKind;

  const param = getRouterParam(event, "slug");
  const slug = Array.isArray(param) ? param.join("/") : String(param || "");
  const normalized = slug
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
  if (!normalized || normalized.includes("..")) {
    throw createError({ statusCode: 400, statusMessage: "Invalid slug" });
  }

  const session = requireAdmin(event);
  const meta = await softDeleteCatalogItem(event, {
    kind,
    slug: normalized,
    actor: session.login,
  });

  await appendAudit(event, {
    action: "trash",
    kind,
    slug: normalized,
    path: meta.path,
    detail: meta.id,
  });

  return {
    kind,
    slug: normalized,
    trashId: meta.id,
    deleted: true,
    soft: true,
    note: "Moved to trash on GitHub. Restore from Admin → Trash.",
  };
});
