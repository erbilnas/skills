export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const q = String(query.q || "")
    .trim()
    .toLowerCase();
  const kindFilter = String(query.kind || "all").trim();
  const limit = Math.min(Number(query.limit) || 30, 100);

  const kinds = (
    ["skills", "mcps", "rules"] as Array<"skills" | "mcps" | "rules">
  ).filter((kind) => kindFilter === "all" || kindFilter === kind);

  const pools = await Promise.all(
    kinds.map(async (kind) => {
      const items = await listCatalog(kind);
      return items.map((item) => ({ kind, ...item }));
    }),
  );

  let results = pools.flat();
  if (q) {
    results = results.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.whenToUse || "").toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.includes(q)) ||
        (item.category || "").toLowerCase().includes(q)
      );
    });
  }

  results.sort((a, b) => a.name.localeCompare(b.name));

  return {
    q: q || null,
    kind: kindFilter,
    count: Math.min(results.length, limit),
    total: results.length,
    results: results.slice(0, limit).map((item) => ({
      kind: item.kind,
      slug: item.slug,
      name: item.name,
      description: item.description,
      whenToUse: item.whenToUse,
      tags: item.tags,
      category: item.category,
      url: `/${item.kind}/${item.slug}`,
    })),
  };
});
