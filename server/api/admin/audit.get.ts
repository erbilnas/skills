export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);
  const limit = Math.min(Number(getQuery(event).limit) || 100, 400);
  const items = await listAudit(event, limit);
  return { count: items.length, items };
});
