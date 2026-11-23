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
  path?: string;
  type?: "website" | "article";
}) {
  const config = useRuntimeConfig();
  const siteUrl = String(config.public.siteUrl || "https://skills.erbilnas.com").replace(
    /\/$/,
    "",
  );
  const route = useRoute();
  const path = input.path || route.path || "/";
  const url = `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const title = catalogTitle(input.title);

  useSeoMeta({
    title,
    description: input.description,
    ogTitle: title,
    ogDescription: input.description,
    ogUrl: url,
    ogType: input.type || "website",
    ogSiteName: "Skills by Erbil Nas",
    twitterCard: "summary",
    twitterTitle: title,
    twitterDescription: input.description,
    ...(input.robots ? { robots: input.robots } : {}),
  });

  useHead({
    link: [{ rel: "canonical", href: url }],
  });
}
