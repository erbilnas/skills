export type AdminCatalogKind = "skills" | "mcps" | "rules";

export interface AdminCatalogMeta {
  slug: string;
  name: string;
  description: string;
  whenToUse?: string | null;
  tags?: string[];
  draft?: boolean;
  private?: boolean;
  source?: string | null;
  transport?: string | null;
  alwaysApply?: boolean | null;
  updatedAt?: string | null;
}

export function kindLabel(kind: AdminCatalogKind) {
  switch (kind) {
    case "skills":
      return "skill";
    case "mcps":
      return "MCP";
    case "rules":
      return "rule";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function kindTitle(kind: AdminCatalogKind) {
  switch (kind) {
    case "skills":
      return "Skills";
    case "mcps":
      return "MCPs";
    case "rules":
      return "Rules";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function useAdminCatalogList(kind: MaybeRefOrGetter<AdminCatalogKind>) {
  const listUrl = computed(() => `/api/${toValue(kind)}?all=1`);
  const { data, pending, error, refresh } = useFetch<{
    items?: AdminCatalogMeta[];
    skills?: AdminCatalogMeta[];
    tags?: string[];
    count?: number;
  }>(listUrl);

  const entries = computed(
    () => data.value?.items || data.value?.skills || [],
  );
  const tags = computed(() => data.value?.tags || []);

  return { data, pending, error, refresh, entries, tags };
}
