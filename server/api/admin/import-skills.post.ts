import { cp, mkdir, readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, relative } from "node:path";

const SKIP = new Set([".DS_Store", "node_modules", ".git"]);

async function findSkillDirs(dir: string, out: string[] = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP.has(entry.name) || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await findSkillDirs(full, out);
    else if (entry.isFile() && entry.name === "SKILL.md") out.push(dirname(full));
  }
  return out;
}

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  requireGithubWrite(event);

  const sourceRoot =
    process.env.SKILLS_SOURCE?.trim() || join(homedir(), ".agents", "skills");

  let skillDirs: string[];
  try {
    skillDirs = await findSkillDirs(sourceRoot);
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: string }).code)
        : "";
    throw createError({
      statusCode: 503,
      statusMessage:
        code === "ENOENT"
          ? `Skills source not available on this host (${sourceRoot}). Run import locally or mount SKILLS_SOURCE.`
          : "Failed to read skills source",
    });
  }

  const destRoot = join(process.cwd(), "skills");
  await mkdir(destRoot, { recursive: true });

  const committed: string[] = [];
  for (const skillDir of skillDirs) {
    const rel = relative(sourceRoot, skillDir);
    const dest = join(destRoot, rel);
    await mkdir(dest, { recursive: true });

    const entries = await readdir(skillDir, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP.has(entry.name)) continue;
      const from = join(skillDir, entry.name);
      const to = join(dest, entry.name);
      if (entry.isDirectory()) await cp(from, to, { recursive: true });
      else if (entry.isFile()) await cp(from, to);
    }

    const skillPath = `skills/${rel.split(/[/\\]/).join("/")}/SKILL.md`;
    const raw = await readFile(join(dest, "SKILL.md"), "utf8");
    const sha = await getFileSha(event, skillPath);
    await putCatalogFile(event, {
      path: skillPath,
      content: raw,
      message: sha
        ? `chore(skills): reimport ${rel}`
        : `feat(skills): import ${rel}`,
      sha,
    });
    committed.push(rel);
  }

  return {
    source: sourceRoot,
    count: committed.length,
    committed,
    note: "Imported to disk and committed to GitHub. Coolify redeploy will refresh the public filesystem catalog.",
  };
});
