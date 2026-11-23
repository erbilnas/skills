import type { CatalogKind } from "../../../../../../utils/catalog";

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

  const body = await readBody<{ draft?: boolean; private?: boolean }>(event);
  const path = `${kind}/${normalized}/${DOC_FILE[kind]}`;
  const file = await getGithubFile(event, path);
  if (!file) {
    throw createError({ statusCode: 404, statusMessage: "Not found on GitHub" });
  }

  const current = parseCatalogFromRaw(kind, normalized, file.content);
  const nextDraft =
    typeof body?.draft === "boolean" ? body.draft : current.draft;
  const nextPrivate =
    typeof body?.private === "boolean" ? body.private : current.private;

  const content = buildCatalogMarkdown({
    name: normalized.split("/").pop() || normalized,
    description: current.description,
    body: current.body,
    whenToUse: current.whenToUse || undefined,
    tags: current.tags,
    draft: nextDraft,
    private: nextPrivate,
    source: current.source || undefined,
    transport: current.transport || undefined,
    alwaysApply:
      typeof current.alwaysApply === "boolean" ? current.alwaysApply : undefined,
  });

  const result = await putCatalogFile(event, {
    path,
    content,
    message: `chore(${kind}): ${nextDraft ? "draft" : "publish"} ${normalized}`,
    sha: file.sha,
  });

  await appendAudit(event, {
    action: nextDraft ? "draft" : "publish",
    kind,
    slug: normalized,
    path,
  });

  return {
    kind,
    slug: normalized,
    draft: nextDraft,
    private: nextPrivate,
    path: result.path,
    previewPath: `/${kind}/${normalized}?source=github`,
    note: "Visibility updated on GitHub.",
  };
});
