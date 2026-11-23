export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const sort = query.sort === "updated" ? "updated" : "name";
  const includeHidden = query.all === "1" && Boolean(getAdminSession(event));
  const items = await listCatalog("rules", { includeHidden, sort });
  return {
    ...catalogListPayload("rules", items),
    sort,
  };
});
