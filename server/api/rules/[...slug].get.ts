export default defineEventHandler(async (event) => {
  const param = getRouterParam(event, "slug");
  const slug = Array.isArray(param) ? param.join("/") : String(param || "");
  const item = await getCatalogItem("rules", slug);
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Rule not found" });
  }
  return item;
});
