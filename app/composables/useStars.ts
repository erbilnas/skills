export type StarKind = "skills" | "mcps" | "rules" | "sets";

export interface StarRef {
  kind: StarKind;
  slug: string;
}

function keyOf(item: StarRef) {
  return `${item.kind}:${item.slug}`;
}

export function useStars() {
  const stars = useCookie<StarRef[]>("catalog-stars", {
    default: () => [],
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  const set = computed(() => new Set((stars.value || []).map(keyOf)));

  function isStarred(item: StarRef) {
    return set.value.has(keyOf(item));
  }

  function toggleStar(item: StarRef) {
    const current = stars.value || [];
    if (isStarred(item)) {
      stars.value = current.filter((entry) => keyOf(entry) !== keyOf(item));
    } else {
      stars.value = [...current, item];
    }
  }

  return { stars, isStarred, toggleStar };
}
