import type { H3Event } from "h3";
import type { CatalogKind } from "./catalog";
import { DOC_FILE } from "./catalog";
import { requireGithubWrite } from "./admin-session";
import {
  deleteCatalogFile,
  getFileSha,
  getGithubFile,
  githubHeaders,
  putCatalogFile,
} from "./github-contents";

export interface TrashMeta {
  id: string;
  kind: CatalogKind;
  slug: string;
  path: string;
  originalPath: string;
  deletedAt: string;
  deletedBy: string;
  name: string;
}

function trashId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function softDeleteCatalogItem(
  event: H3Event,
  input: {
    kind: CatalogKind;
    slug: string;
    actor: string;
  },
) {
  const originalPath = `${input.kind}/${input.slug}/${DOC_FILE[input.kind]}`;
  const file = await getGithubFile(event, originalPath);
  if (!file) {
    throw createError({ statusCode: 404, statusMessage: "Not found on GitHub" });
  }

  const id = trashId();
  const trashDir = `trash/${input.kind}/${input.slug}/${id}`;
  const trashDocPath = `${trashDir}/${DOC_FILE[input.kind]}`;
  const trashMetaPath = `${trashDir}/meta.json`;

  const parsedName =
    file.content.match(/^name:\s*(.+)$/m)?.[1]?.replace(/^["']|["']$/g, "").trim() ||
    input.slug;

  const meta: TrashMeta = {
    id,
    kind: input.kind,
    slug: input.slug,
    path: trashDocPath,
    originalPath,
    deletedAt: new Date().toISOString(),
    deletedBy: input.actor,
    name: parsedName,
  };

  await putCatalogFile(event, {
    path: trashDocPath,
    content: file.content,
    message: `chore(trash): stash ${input.kind}/${input.slug}`,
  });
  await putCatalogFile(event, {
    path: trashMetaPath,
    content: `${JSON.stringify(meta, null, 2)}\n`,
    message: `chore(trash): meta ${input.kind}/${input.slug}`,
  });
  await deleteCatalogFile(event, {
    path: originalPath,
    message: `chore(${input.kind}): soft-delete ${input.slug}`,
    sha: file.sha,
  });

  return meta;
}

export async function listTrash(event: H3Event): Promise<TrashMeta[]> {
  const runtime = requireGithubWrite(event);
  const treeUrl = `https://api.github.com/repos/${runtime.repo}/git/trees/${encodeURIComponent(runtime.branch)}?recursive=1`;
  const res = await fetch(treeUrl, { headers: githubHeaders(runtime.token) });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    tree?: Array<{ path?: string; type?: string }>;
  };
  const metaPaths = (json.tree || [])
    .filter(
      (node) =>
        node.type === "blob" &&
        node.path?.startsWith("trash/") &&
        node.path.endsWith("/meta.json"),
    )
    .map((node) => String(node.path));

  const items: TrashMeta[] = [];
  for (const metaPath of metaPaths.slice(0, 100)) {
    const file = await getGithubFile(event, metaPath);
    if (!file) continue;
    try {
      items.push(JSON.parse(file.content) as TrashMeta);
    } catch {
      // skip
    }
  }

  items.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  return items;
}

export async function restoreTrashItem(
  event: H3Event,
  input: { kind: CatalogKind; slug: string; id: string },
) {
  const trashDir = `trash/${input.kind}/${input.slug}/${input.id}`;
  const trashDocPath = `${trashDir}/${DOC_FILE[input.kind]}`;
  const trashMetaPath = `${trashDir}/meta.json`;

  const doc = await getGithubFile(event, trashDocPath);
  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: "Trash item not found" });
  }

  const originalPath = `${input.kind}/${input.slug}/${DOC_FILE[input.kind]}`;
  const existingSha = await getFileSha(event, originalPath);
  if (existingSha) {
    throw createError({
      statusCode: 409,
      statusMessage: "Target slug already exists. Delete or rename it first.",
    });
  }

  await putCatalogFile(event, {
    path: originalPath,
    content: doc.content,
    message: `feat(${input.kind}): restore ${input.slug} from trash`,
  });

  const metaFile = await getGithubFile(event, trashMetaPath);
  if (metaFile) {
    await deleteCatalogFile(event, {
      path: trashMetaPath,
      message: `chore(trash): clear meta ${input.slug}`,
      sha: metaFile.sha,
    });
  }
  await deleteCatalogFile(event, {
    path: trashDocPath,
    message: `chore(trash): clear doc ${input.slug}`,
    sha: doc.sha,
  });

  return {
    kind: input.kind,
    slug: input.slug,
    restored: true,
    previewPath: `/${input.kind}/${input.slug}?source=github`,
  };
}
