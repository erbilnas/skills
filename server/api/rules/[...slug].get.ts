export default defineEventHandler(async (event) => {
  const param = getRouterParam(event, "slug");
  const slug = Array.isArray(param) ? param.join("/") : String(param || "");
  const query = getQuery(event);
  const includeHidden = Boolean(getAdminSession(event));
  const path = `rules/${slug}/RULE.md`;
  let previewFailed = false;

  if (query.source === "github") {
    try {
      const file = await getGithubFile(event, path);
      if (file) {
        const parsed = parseCatalogFromRaw(
          "rules",
          slug,
          file.content,
          new Date().toISOString(),
        );
        const pool = await listCatalog("rules");
        const [usedWith, changelog] = await Promise.all([
          usedWithFor("rules", parsed),
          listFileCommits(event, path),
        ]);
        return {
          ...parsed,
          related: relatedItems(parsed, pool),
          usedWith,
          changelog,
          preview: true,
          previewFailed: false,
          htmlUrl: file.htmlUrl,
        };
      }
      previewFailed = true;
    } catch {
      previewFailed = true;
    }
  }

  const item = await getCatalogItem("rules", slug, { includeHidden });
  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: previewFailed
        ? "Not on disk yet. GitHub preview failed or is unavailable."
        : "Rule not found",
    });
  }
  const pool = await listCatalog("rules");
  const [usedWith, changelog] = await Promise.all([
    usedWithFor("rules", item),
    listFileCommits(event, path),
  ]);
  return {
    ...item,
    related: relatedItems(item, pool),
    usedWith,
    changelog,
    preview: false,
    previewFailed,
    deployLag:
      query.source === "github" && previewFailed
        ? "Coolify filesystem may be behind GitHub. Preview was requested but unavailable."
        : null,
  };
});
