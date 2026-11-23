import type { CatalogKind } from "../../utils/catalog";
import {
  commitImportedDoc,
  inferKindFromFilename,
  slugifyImportName,
} from "../../utils/import-doc";

const KINDS = new Set<CatalogKind>(["skills", "mcps", "rules"]);
const MAX_BYTES = 512 * 1024;

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);

  const form = await readMultipartFormData(event);
  if (!form?.length) {
    throw createError({ statusCode: 400, statusMessage: "No file uploaded" });
  }

  const file = form.find((part) => part.name === "file" && part.data);
  if (!file?.data) {
    throw createError({ statusCode: 400, statusMessage: "file field required" });
  }
  if (file.data.byteLength > MAX_BYTES) {
    throw createError({
      statusCode: 400,
      statusMessage: "File too large (max 512KB)",
    });
  }

  const filename = String(file.filename || "upload.md");
  if (!/\.(md|mdc|markdown|txt)$/i.test(filename)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Upload a .md, .mdc, or .txt file",
    });
  }

  const kindField = form.find((part) => part.name === "kind");
  const slugField = form.find((part) => part.name === "slug");
  const overwriteField = form.find((part) => part.name === "overwrite");

  const kindParam = String(kindField?.data?.toString("utf8") || "").trim();
  const kind = (
    KINDS.has(kindParam as CatalogKind)
      ? kindParam
      : inferKindFromFilename(filename)
  ) as CatalogKind;

  const slugHint =
    slugifyImportName(String(slugField?.data?.toString("utf8") || "")) ||
    slugifyImportName(filename.replace(/\.(md|mdc|markdown|txt)$/i, "")) ||
    "imported";

  const overwrite =
    String(overwriteField?.data?.toString("utf8") || "") === "1" ||
    String(overwriteField?.data?.toString("utf8") || "") === "true";

  const content = file.data.toString("utf8");

  return commitImportedDoc(event, {
    kind,
    raw: content,
    slugHint,
    overwrite,
  });
});
