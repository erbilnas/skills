export default defineEventHandler(async () => {
  const items = await listCatalog("rules");
  return catalogListPayload("rules", items);
});
