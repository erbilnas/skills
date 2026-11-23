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

  const path = `${kind}/${normalized}/${DOC_FILE[kind]}`;
  const sha = await getFileSha(event, path);
  if (!sha) {
    throw createError({ statusCode: 404, statusMessage: "Not found on GitHub" });
  }

  await deleteCatalogFile(event, {
    path,
    message: `chore(${kind}): delete ${normalized}`,
    sha,
  });

  return {
    kind,
    slug: normalized,
    path,
    deleted: true,
    note: "Deleted on GitHub. Empty folders may remain until cleaned up. Coolify redeploy refreshes the catalog.",
  };
});
