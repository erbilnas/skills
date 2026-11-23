import type { CatalogKind } from "../../../../utils/catalog";

const KINDS = new Set<CatalogKind>(["skills", "mcps", "rules"]);

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);

  const kindParam = String(getRouterParam(event, "kind") || "");
  if (!KINDS.has(kindParam as CatalogKind)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid kind" });
  }
  const kind = kindParam as CatalogKind;

  const body = await readBody<{
    name?: string;
    description?: string;
    body?: string;
    whenToUse?: string;
    tags?: string[] | string;
    draft?: boolean;
    private?: boolean;
    source?: string;
    transport?: string;
    alwaysApply?: boolean;
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
  if (!description) {
    throw createError({ statusCode: 400, statusMessage: "Description required" });
  }
  if (!markdownBody) {
    throw createError({ statusCode: 400, statusMessage: "Body required" });
  }

  const doc = DOC_FILE[kind];
  const path = `${kind}/${name}/${doc}`;
  if (await getFileSha(event, path)) {
    throw createError({ statusCode: 409, statusMessage: "Already exists" });
  }

  const content = buildCatalogMarkdown({
    name,
    description,
    body: markdownBody,
    whenToUse,
    tags,
    draft: Boolean(body?.draft),
    private: Boolean(body?.private),
    source: body?.source,
    transport: body?.transport,
    alwaysApply: body?.alwaysApply,
  });

  const result = await putCatalogFile(event, {
    path,
    content,
    message: `feat(${kind}): add ${name}`,
  });

  return {
    kind,
    slug: name,
    path: result.path,
    htmlUrl: result.htmlUrl,
    previewPath: `/${kind}/${name}?source=github`,
    note: "Committed to GitHub. Use live preview while Coolify redeploys.",
  };
});
