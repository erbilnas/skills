import {
  buildCatalogMarkdown,
  getCatalogItem,
  listCatalog,
  type CatalogDetail,
  type CatalogMeta,
} from "./catalog";

export type SkillMeta = CatalogMeta;
export type SkillDetail = CatalogDetail;

export { renderMarkdownHtml as renderSkillHtml } from "./catalog";

export async function listSkills(options?: {
  includeHidden?: boolean;
  sort?: "name" | "updated";
}): Promise<SkillMeta[]> {
  return listCatalog("skills", options);
}

export async function getSkill(
  slug: string,
  options?: { includeHidden?: boolean },
): Promise<SkillDetail | null> {
  return getCatalogItem("skills", slug, options);
}

export function isValidSkillName(name: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) && name.length <= 64;
}

export function buildSkillMarkdown(input: {
  name: string;
  description: string;
  body: string;
  whenToUse?: string;
  tags?: string[];
  draft?: boolean;
  private?: boolean;
}) {
  return buildCatalogMarkdown(input);
}
