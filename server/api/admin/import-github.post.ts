import type { CatalogKind } from "../../utils/catalog";
import {
  commitImportedDoc,
  fetchGithubMarkdown,
  inferKindFromFilename,
  slugFromGithubUrl,
  slugifyImportName,
} from "../../utils/import-doc";

const KINDS = new Set<CatalogKind>(["skills", "mcps", "rules"]);

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);

  const body = await readBody<{
    url?: string;
    kind?: string;
    slug?: string;
    overwrite?: boolean;
  }>(event);

  const url = String(body?.url || "").trim();
  if (!url) {
    throw createError({ statusCode: 400, statusMessage: "URL required" });
  }

  const kindParam = String(body?.kind || "").trim();
  const kind = (
    KINDS.has(kindParam as CatalogKind)
      ? kindParam
      : inferKindFromFilename(url)
  ) as CatalogKind;

  const { text } = await fetchGithubMarkdown(url);
  const slugHint =
    slugifyImportName(String(body?.slug || "")) ||
    slugFromGithubUrl(url) ||
    "imported";

  return commitImportedDoc(event, {
    kind,
    raw: text,
    slugHint,
    overwrite: Boolean(body?.overwrite),
  });
});
