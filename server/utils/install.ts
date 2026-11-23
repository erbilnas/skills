export function installCommand(repo: string, slug: string) {
  const cleanRepo = String(repo || "erbilnas/skills").replace(/^\/|\/$/g, "");
  return `npx skills add ${cleanRepo}/${slug}`;
}
