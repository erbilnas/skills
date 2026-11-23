export default defineEventHandler(async (event) => {
  const param = getRouterParam(event, "slug");
  const slug = Array.isArray(param) ? param.join("/") : String(param || "");
  const query = getQuery(event);
  const includeHidden = Boolean(getAdminSession(event));

  if (query.source === "github") {
    try {
      const file = await getGithubFile(event, `mcps/${slug}/MCP.md`);
      if (file) {
        const parsed = parseCatalogFromRaw(
          "mcps",
          slug,
          file.content,
          new Date().toISOString(),
        );
        const pool = await listCatalog("mcps");
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

  const item = await getCatalogItem("mcps", slug, { includeHidden });
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "MCP not found" });
  }
  const pool = await listCatalog("mcps");
  return { ...item, related: relatedItems(item, pool), preview: false };
});
