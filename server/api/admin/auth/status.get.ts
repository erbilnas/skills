export default defineEventHandler((event) => {
  const oauthMissing = listAdminMissing(event);
  const writeMissing = listGithubWriteMissing(event);
  return {
    configured: oauthMissing.length === 0,
    writeConfigured: writeMissing.length === 0,
    missing: [...oauthMissing, ...writeMissing],
  };
});
