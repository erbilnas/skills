import type { CatalogKind } from "../../../../../utils/catalog";

const KINDS = new Set<CatalogKind>(["skills", "mcps", "rules"]);

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);

  const kindParam = String(getRouterParam(event, "kind") || "");
  if (!KINDS.has(kindParam as CatalogKind)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid kind" });
  }
  const kind = kindParam as CatalogKind;

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
    source?: string;
    transport?: string;
    alwaysApply?: boolean;
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

  if (!description || !markdownBody) {
    throw createError({
      statusCode: 400,
      statusMessage: "Description and body are required",
    });
  }

  const folderName = normalized.split("/").pop() || normalized;
  const path = `${kind}/${normalized}/${DOC_FILE[kind]}`;
  const sha = await getFileSha(event, path);
  if (!sha) {
    throw createError({ statusCode: 404, statusMessage: "Not found on GitHub" });
  }

  const content = buildCatalogMarkdown({
    name: folderName,
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
    message: `feat(${kind}): update ${normalized}`,
    sha,
  });

  await appendAudit(event, {
    action: "update",
    kind,
    slug: normalized,
    path: result.path,
  });

  return {
    kind,
    slug: normalized,
    path: result.path,
    htmlUrl: result.htmlUrl,
    previewPath: `/${kind}/${normalized}?source=github`,
    note: "Committed to GitHub. Use live preview while Coolify redeploys.",
  };
});
