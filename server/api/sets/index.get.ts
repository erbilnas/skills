import { SKILL_SETS } from "../../../constants/sets";

export default defineEventHandler(async () => {
  const skills = await listCatalog("skills");
  const bySlug = new Map(skills.map((item) => [item.slug, item]));

  const sets = SKILL_SETS.map((set) => {
    const items = set.skills
      .map((slug) => bySlug.get(slug))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    return {
      slug: set.slug,
      name: set.name,
      description: set.description,
      count: items.length,
      skills: items,
    };
  });

  return {
    count: sets.length,
    sets,
  };
});
