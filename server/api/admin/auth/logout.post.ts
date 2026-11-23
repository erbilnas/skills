export default defineEventHandler(async (event) => {
  clearAdminSession(event);
  return { status: "ok" };
});
