export default defineEventHandler(async () => {
  const items = await listCatalog("mcps");
  return catalogListPayload("mcps", items);
});
