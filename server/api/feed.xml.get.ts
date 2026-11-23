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
  const skills = await listCatalog("skills", { sort: "updated" });

  const items = skills
    .slice(0, 50)
    .map((skill) => {
      const link = `${siteUrl}/skills/${skill.slug}`;
      const updated = skill.updatedAt || new Date().toISOString();
      return `    <item>
      <title>${escapeXml(skill.name)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${escapeXml(new Date(updated).toUTCString())}</pubDate>
      <description>${escapeXml(skill.whenToUse || skill.description)}</description>
      <category>${escapeXml((skill.tags || []).join(", "))}</category>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Skills by Erbil Nas</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Agent skills catalog updates</description>
    <lastBuildDate>${escapeXml(new Date().toUTCString())}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  setHeader(event, "Content-Type", "application/rss+xml; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=300");
  return xml;
});
