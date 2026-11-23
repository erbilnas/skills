export default defineEventHandler((event) => {
  const session = requireAdmin(event);
  return { login: session.login };
});
