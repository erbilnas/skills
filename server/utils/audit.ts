import type { H3Event } from "h3";
import { getAdminSession } from "./admin-session";
import { getFileSha, getGithubFile, putCatalogFile } from "./github-contents";

const AUDIT_PATH = "audit/log.jsonl";
const MAX_LINES = 400;

export interface AuditEntry {
  at: string;
  actor: string;
  action: string;
  kind?: string;
  slug?: string;
  path?: string;
  detail?: string;
}

export async function appendAudit(
  event: H3Event,
  entry: Omit<AuditEntry, "at" | "actor"> & { actor?: string },
) {
  const session = getAdminSession(event);
  const row: AuditEntry = {
    at: new Date().toISOString(),
    actor: entry.actor || session?.login || "unknown",
    action: entry.action,
    kind: entry.kind,
    slug: entry.slug,
    path: entry.path,
    detail: entry.detail,
  };

  try {
    const existing = await getGithubFile(event, AUDIT_PATH);
    const prev = existing?.content || "";
    const lines = [...prev.split("\n").filter(Boolean), JSON.stringify(row)];
    const trimmed = lines.slice(-MAX_LINES).join("\n") + "\n";
    await putCatalogFile(event, {
      path: AUDIT_PATH,
      content: trimmed,
      message: `chore(audit): ${row.action}${row.slug ? ` ${row.slug}` : ""}`,
      sha: existing?.sha || (await getFileSha(event, AUDIT_PATH)),
    });
  } catch {
    // Audit must not block the primary write.
  }

  return row;
}

export async function listAudit(event: H3Event, limit = 100) {
  const file = await getGithubFile(event, AUDIT_PATH);
  if (!file?.content) return [];
  return file.content
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as AuditEntry;
      } catch {
        return null;
      }
    })
    .filter((entry): entry is AuditEntry => Boolean(entry))
    .reverse()
    .slice(0, limit);
}
