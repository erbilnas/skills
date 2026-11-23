export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);

  const param = getRouterParam(event, "slug");
  const slug = Array.isArray(param) ? param.join("/") : String(param || "");
  const normalized = slug
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");

  if (!normalized || normalized.includes("..")) {
    throw createError({ statusCode: 400, statusMessage: "Invalid slug" });
  }

  const body = await readBody<{
    description?: string;
    body?: string;
    whenToUse?: string;
    tags?: string[] | string;
    draft?: boolean;
    private?: boolean;
  }>(event);

  const description = String(body?.description || "").trim();
  const markdownBody = String(body?.body || "").trim();
  const whenToUse = String(body?.whenToUse || "").trim();
  const tags = Array.isArray(body?.tags)
    ? body.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
    : String(body?.tags || "")
        .split(/[,|]/)
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);

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

  const folderName = normalized.split("/").pop() || normalized;
  const path = `skills/${normalized}/SKILL.md`;
  const sha = await getFileSha(event, path);
  if (!sha) {
    throw createError({
      statusCode: 404,
      statusMessage: "Skill not found on GitHub",
    });
  }

  const content = buildSkillMarkdown({
    name: folderName,
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
    message: `feat(skills): update ${normalized}`,
    sha,
  });

  return {
    slug: normalized,
    path: result.path,
    htmlUrl: result.htmlUrl,
    previewPath: `/skills/${normalized}?source=github`,
    note: "Committed to GitHub. Open live preview now, or wait for Coolify redeploy for filesystem catalog.",
  };
});
