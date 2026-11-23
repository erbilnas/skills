export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);

  const body = await readBody<{
    name?: string;
    description?: string;
    body?: string;
    whenToUse?: string;
    tags?: string[] | string;
    draft?: boolean;
    private?: boolean;
  }>(event);

  const name = String(body?.name || "")
    .trim()
    .toLowerCase();
  const description = String(body?.description || "").trim();
  const markdownBody = String(body?.body || "").trim();
  const whenToUse = String(body?.whenToUse || "").trim();
  const tags = Array.isArray(body?.tags)
    ? body.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
    : String(body?.tags || "")
        .split(/[,|]/)
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);

  if (!isValidSkillName(name)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Name must be lowercase letters, numbers, and hyphens (max 64)",
    });
  }
  if (!description || description.length > 1024) {
    throw createError({
      statusCode: 400,
      statusMessage: "Description is required (max 1024 characters)",
    });
  }
  if (!markdownBody) {
    throw createError({
      statusCode: 400,
      statusMessage: "Body is required",
    });
  }

  const path = `skills/${name}/SKILL.md`;
  const existing = await getFileSha(event, path);
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "Skill already exists",
    });
  }

  const content = buildSkillMarkdown({
    name,
    description,
    body: markdownBody,
    whenToUse,
    tags,
    draft: Boolean(body?.draft),
    private: Boolean(body?.private),
  });

  const result = await putCatalogFile(event, {
    path,
    content,
    message: `feat(skills): add ${name}`,
  });

  return {
    slug: name,
    path: result.path,
    htmlUrl: result.htmlUrl,
    previewPath: `/skills/${name}?source=github`,
    note: "Committed to GitHub. Open live preview now, or wait for Coolify redeploy for filesystem catalog.",
  };
});
