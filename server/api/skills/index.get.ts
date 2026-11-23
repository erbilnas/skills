export default defineEventHandler(async () => {
  const items = await listCatalog("skills");
  const payload = catalogListPayload("skills", items);
  return {
    count: payload.count,
    categories: payload.categories,
    skills: payload.items,
  };
});
