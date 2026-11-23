export default defineEventHandler(async (event) => {
  const param = getRouterParam(event, "slug");
  const slug = Array.isArray(param) ? param.join("/") : String(param || "");
  const skill = await getCatalogItem("skills", slug);
  if (!skill) {
    throw createError({ statusCode: 404, statusMessage: "Skill not found" });
  }
  return skill;
});
