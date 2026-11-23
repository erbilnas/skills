export default defineEventHandler(async (event) => {
  const param = getRouterParam(event, "slug");
  const slug = Array.isArray(param) ? param.join("/") : String(param || "");
  const item = await getCatalogItem("mcps", slug);
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "MCP not found" });
  }
  return item;
});
