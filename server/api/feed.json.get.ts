export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const siteUrl = String(config.public.siteUrl || "").replace(/\/$/, "");
  const repo = String(config.public.githubRepo || "erbilnas/skills");

  const [skills, mcps, rules] = await Promise.all([
    listCatalog("skills", { sort: "updated" }),
    listCatalog("mcps", { sort: "updated" }),
    listCatalog("rules", { sort: "updated" }),
  ]);

  setHeader(event, "Content-Type", "application/json; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=300");

  return {
    site: siteUrl,
    generatedAt: new Date().toISOString(),
    skills: skills.map((item) => ({
      ...item,
      url: `${siteUrl}/skills/${item.slug}`,
      install: installCommand(repo, item.slug),
    })),
    mcps: mcps.map((item) => ({
      ...item,
      url: `${siteUrl}/mcps/${item.slug}`,
    })),
    rules: rules.map((item) => ({
      ...item,
      url: `${siteUrl}/rules/${item.slug}`,
    })),
  };
});
