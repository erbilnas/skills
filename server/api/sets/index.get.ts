export default defineEventHandler(async () => {
  const [sets, skills] = await Promise.all([
    listSets({ includeHidden: false }),
    listCatalog("skills"),
  ]);
  const bySlug = new Map(skills.map((item) => [item.slug, item]));

  const payload = sets.map((set) => {
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
    count: payload.length,
    sets: payload,
  };
});
