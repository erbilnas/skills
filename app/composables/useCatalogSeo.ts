/** Page titles: "Name · Skills" off home; home keeps the site title. */
export function catalogTitle(page?: string | null) {
  const site = "Skills by Erbil Nas";
  const label = String(page || "").trim();
  if (!label) return site;
  return `${label} · Skills`;
}

export function useCatalogSeo(input: {
  title?: string | null;
  description: string;
  robots?: string;
}) {
  useSeoMeta({
    title: catalogTitle(input.title),
    description: input.description,
    ogTitle: catalogTitle(input.title),
    ogDescription: input.description,
    twitterCard: "summary",
    ...(input.robots ? { robots: input.robots } : {}),
  });
}
