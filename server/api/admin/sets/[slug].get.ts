export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const slug = String(getRouterParam(event, "slug") || "").trim();
  const query = getQuery(event);

  if (query.source === "github") {
    try {
      const file = await getGithubFile(event, `sets/${slug}/SET.md`);
      if (file) {
        return {
          ...parseSetFromRaw(slug, file.content, new Date().toISOString()),
          preview: true,
          htmlUrl: file.htmlUrl,
        };
      }
    } catch {
      // filesystem fallback
    }
  }

  const item = await getSet(slug, { includeHidden: true });
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Set not found" });
  }
  return { ...item, preview: false };
});
