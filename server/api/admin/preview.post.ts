export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const body = await readBody<{ markdown?: string }>(event);
  const markdown = String(body?.markdown || "");
  return {
    html: renderMarkdownHtml(markdown),
  };
});
