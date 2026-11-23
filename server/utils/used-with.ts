import type { CatalogKind, CatalogMeta } from "./catalog";
import { listCatalog } from "./catalog";

export interface UsedWithItem {
  kind: CatalogKind;
  slug: string;
  name: string;
  description: string;
  whenToUse: string | null;
  score: number;
}

export async function usedWithFor(
  kind: CatalogKind,
  item: CatalogMeta,
  limit = 8,
): Promise<UsedWithItem[]> {
  const otherKinds = (["skills", "mcps", "rules"] as CatalogKind[]).filter(
    (entry) => entry !== kind,
  );
  const pools = await Promise.all(
    otherKinds.map(async (otherKind) => {
      const items = await listCatalog(otherKind);
      return items.map((candidate) => ({ kind: otherKind, candidate }));
    }),
  );

  const tags = new Set(item.tags);
  const scored: UsedWithItem[] = [];

  for (const { kind: otherKind, candidate } of pools.flat()) {
    const overlap = candidate.tags.filter((tag) => tags.has(tag)).length;
    const sameCategory =
      item.category && candidate.category === item.category ? 1 : 0;
    const score = overlap * 2 + sameCategory;
    if (score <= 0) continue;
    scored.push({
      kind: otherKind,
      slug: candidate.slug,
      name: candidate.name,
      description: candidate.description,
      whenToUse: candidate.whenToUse,
      score,
    });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.name.localeCompare(b.name),
  );
  return scored.slice(0, limit);
}
