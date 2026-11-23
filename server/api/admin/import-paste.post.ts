import type { CatalogKind } from "../../utils/catalog";
import {
  commitImportedDoc,
  slugifyImportName,
} from "../../utils/import-doc";

const KINDS = new Set<CatalogKind>(["skills", "mcps", "rules"]);

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);

  const body = await readBody<{
    content?: string;
    kind?: string;
    slug?: string;
    overwrite?: boolean;
  }>(event);

  const content = String(body?.content || "");
  if (!content.trim()) {
    throw createError({ statusCode: 400, statusMessage: "Content required" });
  }

  const kindParam = String(body?.kind || "skills").trim();
  if (!KINDS.has(kindParam as CatalogKind)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid kind" });
  }

  const slugHint = slugifyImportName(String(body?.slug || "")) || "imported";

  return commitImportedDoc(event, {
    kind: kindParam as CatalogKind,
    raw: content,
    slugHint,
    overwrite: Boolean(body?.overwrite),
  });
});
