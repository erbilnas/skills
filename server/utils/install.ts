export function installCommand(repo: string, slug: string) {
  const cleanRepo = String(repo || "erbilnas/skills").replace(/^\/|\/$/g, "");
  return `npx skills add ${cleanRepo}/${slug}`;
}

/** Multi-line install block for a whole set (one command per skill). */
export function installSetScript(repo: string, slugs: string[]) {
  return slugs.map((slug) => installCommand(repo, slug)).join("\n");
}
