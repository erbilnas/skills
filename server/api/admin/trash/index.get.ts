export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);
  const items = await listTrash(event);
  return { count: items.length, items };
});
