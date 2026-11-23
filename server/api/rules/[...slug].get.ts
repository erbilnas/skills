export default defineEventHandler(async (event) => {
  const param = getRouterParam(event, "slug");
  const slug = Array.isArray(param) ? param.join("/") : String(param || "");
  const query = getQuery(event);
  const includeHidden = Boolean(getAdminSession(event));

  if (query.source === "github") {
    try {
      const file = await getGithubFile(event, `rules/${slug}/RULE.md`);
      if (file) {
        const parsed = parseCatalogFromRaw(
          "rules",
          slug,
          file.content,
          new Date().toISOString(),
        );
        const pool = await listCatalog("rules");
        return {
          ...parsed,
          related: relatedItems(parsed, pool),
          preview: true,
          htmlUrl: file.htmlUrl,
        };
      }
    } catch {
      // filesystem fallback
    }
  }

  const item = await getCatalogItem("rules", slug, { includeHidden });
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Rule not found" });
  }
  const pool = await listCatalog("rules");
  return { ...item, related: relatedItems(item, pool), preview: false };
});
