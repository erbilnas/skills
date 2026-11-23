import {
  getCatalogItem,
  listCatalog,
  type CatalogDetail,
  type CatalogMeta,
} from "./catalog";

export type SkillMeta = CatalogMeta;
export type SkillDetail = CatalogDetail;

export { renderMarkdownHtml as renderSkillHtml } from "./catalog";

export async function listSkills(): Promise<SkillMeta[]> {
  return listCatalog("skills");
}

export async function getSkill(slug: string): Promise<SkillDetail | null> {
  return getCatalogItem("skills", slug);
}

export function isValidSkillName(name: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) && name.length <= 64;
}

export function buildSkillMarkdown(input: {
  name: string;
  description: string;
  body: string;
}) {
  const description = input.description.trim();
  const body = input.body.trim();
  return `---\nname: ${input.name}\ndescription: ${JSON.stringify(description)}\n---\n\n${body}\n`;
}
