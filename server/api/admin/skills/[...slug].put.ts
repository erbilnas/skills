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
  }>(event);

  const description = String(body?.description || "").trim();
  const markdownBody = String(body?.body || "").trim();

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
    throw createError({ statusCode: 404, statusMessage: "Skill not found on GitHub" });
  }

  const content = buildSkillMarkdown({
    name: folderName,
    description,
    body: markdownBody,
  });

  const result = await putSkillFile(event, {
    path,
    content,
    message: `feat(skills): update ${normalized}`,
    sha,
  });

  return {
    slug: normalized,
    path: result.path,
    htmlUrl: result.htmlUrl,
    note: "Committed to GitHub. Coolify redeploy will publish it to the catalog.",
  };
});
