export default defineEventHandler(async (event) => {
  const param = getRouterParam(event, "slug");
  const slug = Array.isArray(param) ? param.join("/") : String(param || "");
  const query = getQuery(event);
  const fromGithub = query.source === "github";
  const includeHidden = Boolean(getAdminSession(event));
  const path = `skills/${slug}/SKILL.md`;

  let previewFailed = false;

  if (fromGithub) {
    try {
      const file = await getGithubFile(event, path);
      if (file) {
        const parsed = parseCatalogFromRaw(
          "skills",
          slug,
          file.content,
          new Date().toISOString(),
        );
        const pool = await listCatalog("skills", { includeHidden: false });
        const [usedWith, changelog] = await Promise.all([
          usedWithFor("skills", parsed),
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

  const skill = await getCatalogItem("skills", slug, { includeHidden });
  if (!skill) {
    throw createError({
      statusCode: 404,
      statusMessage: previewFailed
        ? "Not on disk yet. GitHub preview failed or is unavailable."
        : "Skill not found",
    });
  }

  const pool = await listCatalog("skills", { includeHidden: false });
  const [usedWith, changelog] = await Promise.all([
    usedWithFor("skills", skill),
    listFileCommits(event, path),
  ]);

  return {
    ...skill,
    related: relatedItems(skill, pool),
    usedWith,
    changelog,
    preview: false,
    previewFailed,
    deployLag:
      fromGithub && previewFailed
        ? "Coolify filesystem may be behind GitHub. Preview was requested but unavailable."
        : null,
  };
});
