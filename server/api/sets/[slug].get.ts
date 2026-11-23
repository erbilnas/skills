import { getSkillSet, SKILL_SETS } from "../../../constants/sets";

export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, "slug") || "").trim();
  const def = getSkillSet(slug);
  if (!def) {
    throw createError({ statusCode: 404, statusMessage: "Set not found" });
  }

  const catalog = await listCatalog("skills");
  const bySlug = new Map(catalog.map((item) => [item.slug, item]));
  const skills = def.skills
    .map((skillSlug) => bySlug.get(skillSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const others = SKILL_SETS.filter((set) => set.slug !== def.slug).map(
    (set) => ({
      slug: set.slug,
      name: set.name,
      description: set.description,
      count: set.skills.filter((skillSlug) => bySlug.has(skillSlug)).length,
    }),
  );

  return {
    slug: def.slug,
    name: def.name,
    description: def.description,
    count: skills.length,
    skills,
    others,
  };
});
