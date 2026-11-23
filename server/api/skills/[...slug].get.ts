export default defineEventHandler(async (event) => {
  const param = getRouterParam(event, "slug");
  const slug = Array.isArray(param) ? param.join("/") : String(param || "");
  const query = getQuery(event);
  const fromGithub = query.source === "github";
  const includeHidden = Boolean(getAdminSession(event));

  if (fromGithub) {
    try {
      const path = `skills/${slug}/SKILL.md`;
      const file = await getGithubFile(event, path);
      if (file) {
        const parsed = parseCatalogFromRaw(
          "skills",
          slug,
          file.content,
          new Date().toISOString(),
        );
        const pool = await listCatalog("skills", { includeHidden: false });
        return {
          ...parsed,
          related: relatedItems(parsed, pool),
          preview: true,
          htmlUrl: file.htmlUrl,
        };
      }
    } catch {
      // Fall through to filesystem.
    }
  }

  const skill = await getCatalogItem("skills", slug, { includeHidden });
  if (!skill) {
    throw createError({ statusCode: 404, statusMessage: "Skill not found" });
  }

  const pool = await listCatalog("skills", { includeHidden: false });
  return {
    ...skill,
    related: relatedItems(skill, pool),
    preview: false,
  };
});
