export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);

  const slug = String(getRouterParam(event, "slug") || "").trim();
  if (!slug || slug.includes("..") || slug.includes("/")) {
    throw createError({ statusCode: 400, statusMessage: "Invalid slug" });
  }

  const path = `sets/${slug}/SET.md`;
  const sha = await getFileSha(event, path);
  if (!sha) {
    throw createError({ statusCode: 404, statusMessage: "Not found on GitHub" });
  }

  await deleteCatalogFile(event, {
    path,
    message: `chore(sets): delete ${slug}`,
    sha,
  });

  return {
    slug,
    path,
    deleted: true,
    note: "Deleted on GitHub. Coolify redeploy refreshes the catalog.",
  };
});
