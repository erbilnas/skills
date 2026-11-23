export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const items = await listSets({ includeHidden: true });
  return {
    count: items.length,
    sets: items,
  };
});
