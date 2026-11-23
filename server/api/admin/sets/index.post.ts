export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);

  const body = await readBody<{
    name?: string;
    description?: string;
    skills?: string[] | string;
    body?: string;
    draft?: boolean;
    private?: boolean;
  }>(event);

  const name = String(body?.name || "")
    .trim()
    .toLowerCase();
  const description = String(body?.description || "").trim();
  const skills = Array.isArray(body?.skills)
    ? body.skills.map((s) => String(s).trim()).filter(Boolean)
    : String(body?.skills || "")
        .split(/[,|\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
  const markdownBody = String(body?.body || "").trim();

  if (!isValidSkillName(name)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Name must be lowercase letters, numbers, and hyphens (max 64)",
    });
  }
  if (!description) {
    throw createError({ statusCode: 400, statusMessage: "Description required" });
  }
  if (!skills.length) {
    throw createError({ statusCode: 400, statusMessage: "At least one skill slug required" });
  }

  const path = `sets/${name}/SET.md`;
  if (await getFileSha(event, path)) {
    throw createError({ statusCode: 409, statusMessage: "Already exists" });
  }

  const content = buildSetMarkdown({
    name,
    description,
    skills,
    body: markdownBody,
    draft: Boolean(body?.draft),
    private: Boolean(body?.private),
  });

  const result = await putCatalogFile(event, {
    path,
    content,
    message: `feat(sets): add ${name}`,
  });

  return {
    slug: name,
    path: result.path,
    htmlUrl: result.htmlUrl,
    previewPath: `/sets/${name}`,
    note: "Committed to GitHub. Coolify redeploy publishes the set.",
  };
});
