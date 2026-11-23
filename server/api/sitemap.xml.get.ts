function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const siteUrl = String(config.public.siteUrl || "").replace(/\/$/, "");

  const [skills, mcps, rules, sets] = await Promise.all([
    listCatalog("skills"),
    listCatalog("mcps"),
    listCatalog("rules"),
    listSets(),
  ]);

  const staticPaths = ["", "/sets", "/mcps", "/rules", "/starred"];
  const urls: Array<{ loc: string; lastmod?: string | null }> = [
    ...staticPaths.map((path) => ({ loc: `${siteUrl}${path || "/"}` })),
    ...skills.map((item) => ({
      loc: `${siteUrl}/skills/${item.slug}`,
      lastmod: item.updatedAt,
    })),
    ...mcps.map((item) => ({
      loc: `${siteUrl}/mcps/${item.slug}`,
      lastmod: item.updatedAt,
    })),
    ...rules.map((item) => ({
      loc: `${siteUrl}/rules/${item.slug}`,
      lastmod: item.updatedAt,
    })),
    ...sets.map((item) => ({
      loc: `${siteUrl}/sets/${item.slug}`,
      lastmod: item.updatedAt,
    })),
  ];

  const body = urls
    .map((entry) => {
      const last = entry.lastmod
        ? `\n    <lastmod>${escapeXml(entry.lastmod.slice(0, 10))}</lastmod>`
        : "";
      return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${last}\n  </url>`;
    })
    .join("\n");

  setHeader(event, "Content-Type", "application/xml; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=300");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
});
