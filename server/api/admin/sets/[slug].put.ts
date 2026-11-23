export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);

  const slug = String(getRouterParam(event, "slug") || "").trim();
  if (!slug || slug.includes("..") || slug.includes("/")) {
    throw createError({ statusCode: 400, statusMessage: "Invalid slug" });
  }

  const body = await readBody<{
    description?: string;
    skills?: string[] | string;
    body?: string;
    draft?: boolean;
    private?: boolean;
  }>(event);

  const description = String(body?.description || "").trim();
  const skills = Array.isArray(body?.skills)
    ? body.skills.map((s) => String(s).trim()).filter(Boolean)
    : String(body?.skills || "")
        .split(/[,|\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
  const markdownBody = String(body?.body || "").trim();

  if (!description || !skills.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Description and skills are required",
    });
  }

  const path = `sets/${slug}/SET.md`;
  const sha = await getFileSha(event, path);
  if (!sha) {
    throw createError({ statusCode: 404, statusMessage: "Not found on GitHub" });
  }

  const content = buildSetMarkdown({
    name: slug,
    description,
    skills,
    body: markdownBody,
    draft: Boolean(body?.draft),
    private: Boolean(body?.private),
  });

  const result = await putCatalogFile(event, {
    path,
    content,
    message: `feat(sets): update ${slug}`,
    sha,
  });

  return {
    slug,
    path: result.path,
    htmlUrl: result.htmlUrl,
    previewPath: `/sets/${slug}`,
    note: "Committed to GitHub. Coolify redeploy publishes the set.",
  };
});
