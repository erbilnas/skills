<script setup lang="ts">
export interface CatalogRow {
  slug: string;
  name: string;
  description: string;
  whenToUse?: string | null;
  category: string | null;
  tags?: string[];
  updatedAt?: string | null;
  source?: string | null;
  transport?: string | null;
  alwaysApply?: boolean | null;
  draft?: boolean;
  private?: boolean;
}

type LayoutMode = "list" | "grid";
type SortMode = "name" | "updated";

const props = defineProps<{
  basePath: string;
  items: CatalogRow[];
  tags?: string[];
  pending?: boolean;
  error?: boolean;
  emptyLabel?: string;
  showInstall?: boolean;
}>();

const route = useRoute();
const router = useRouter();
const searchInput = ref<HTMLInputElement | null>(null);

const query = ref(String(route.query.q || ""));
const category = ref(String(route.query.category || "all"));
const tag = ref(String(route.query.tag || "all"));
const sort = ref<SortMode>(route.query.sort === "updated" ? "updated" : "name");
const layout = useCookie<LayoutMode>("catalog-layout", {
  default: () =>
    route.query.layout === "grid" ? "grid" : ("list" as LayoutMode),
  sameSite: "lax",
});

if (route.query.layout === "list" || route.query.layout === "grid") {
  layout.value = route.query.layout;
}

const categories = computed(() => {
  return [
    ...new Set(
      props.items
        .map((item) => item.category)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b));
});

const allTags = computed(() => {
  if (props.tags?.length) return [...props.tags].sort((a, b) => a.localeCompare(b));
  return [
    ...new Set(props.items.flatMap((item) => item.tags || [])),
  ].sort((a, b) => a.localeCompare(b));
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  let rows = props.items.filter((item) => {
    if (category.value !== "all" && item.category !== category.value) {
      return false;
    }
    if (tag.value !== "all" && !(item.tags || []).includes(tag.value)) {
      return false;
    }
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.whenToUse || "").toLowerCase().includes(q) ||
      item.slug.toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q) ||
      (item.tags || []).some((entry) => entry.includes(q)) ||
      (item.transport || "").toLowerCase().includes(q)
    );
  });

  if (sort.value === "updated") {
    rows = [...rows].sort((a, b) => {
      const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      if (bTime !== aTime) return bTime - aTime;
      return a.name.localeCompare(b.name);
    });
  } else {
    rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
  }
  return rows;
});

const isFiltered = computed(
  () =>
    Boolean(query.value.trim()) ||
    category.value !== "all" ||
    tag.value !== "all",
);

function metaLine(item: CatalogRow) {
  const bits = [
    item.category,
    item.transport,
    item.alwaysApply ? "always" : null,
    item.draft ? "draft" : null,
    item.private ? "private" : null,
  ].filter(Boolean);
  return bits.join(" · ");
}

function syncUrl() {
  const next: Record<string, string> = {};
  if (query.value.trim()) next.q = query.value.trim();
  if (category.value !== "all") next.category = category.value;
  if (tag.value !== "all") next.tag = tag.value;
  if (sort.value !== "name") next.sort = sort.value;
  if (layout.value !== "list") next.layout = layout.value;
  router.replace({ query: next });
}

watch([query, category, tag, sort, layout], syncUrl);

watch(
  () => route.query,
  (next) => {
    const nextQ = String(next.q || "");
    const nextCategory = String(next.category || "all");
    const nextTag = String(next.tag || "all");
    const nextSort: SortMode = next.sort === "updated" ? "updated" : "name";
    const nextLayout: LayoutMode =
      next.layout === "grid" ? "grid" : "list";
    if (query.value !== nextQ) query.value = nextQ;
    if (category.value !== nextCategory) category.value = nextCategory;
    if (tag.value !== nextTag) tag.value = nextTag;
    if (sort.value !== nextSort) sort.value = nextSort;
    if (layout.value !== nextLayout) layout.value = nextLayout;
  },
);

function setLayout(mode: LayoutMode) {
  layout.value = mode;
}

function setTag(next: string) {
  tag.value = next;
}

const config = useRuntimeConfig();
const repo = computed(() =>
  String(config.public.githubRepo || "erbilnas/skills").replace(/^\/|\/$/g, ""),
);

function installFor(slug: string) {
  return `npx skills add ${repo.value}/${slug}`;
}

const copiedSlug = ref("");
async function copyInstall(slug: string, event?: Event) {
  event?.preventDefault();
  event?.stopPropagation();
  try {
    await navigator.clipboard.writeText(installFor(slug));
    copiedSlug.value = slug;
    setTimeout(() => {
      if (copiedSlug.value === slug) copiedSlug.value = "";
    }, 1400);
  } catch {
    copiedSlug.value = "";
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }
  const target = event.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable)
  ) {
    return;
  }
  event.preventDefault();
  searchInput.value?.focus();
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <div>
    <div
      class="font-sans-ui mb-6 flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:gap-4"
    >
      <label class="relative min-w-0 flex-1">
        <span class="sr-only">Search</span>
        <svg
          class="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          ref="searchInput"
          v-model="query"
          type="search"
          placeholder="Search · press /"
          class="w-full bg-transparent py-2 pl-7 pr-2 text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
        />
      </label>

      <div class="flex flex-wrap items-center gap-3 sm:justify-end">
        <label v-if="categories.length" class="relative">
          <span class="sr-only">Filter by category</span>
          <select
            v-model="category"
            class="max-w-[11rem] cursor-pointer appearance-none bg-transparent py-2 pr-5 text-sm outline-none"
          >
            <option value="all">All categories</option>
            <option v-for="item in categories" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
          <svg
            class="pointer-events-none absolute right-0 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </label>

        <label class="relative">
          <span class="sr-only">Sort</span>
          <select
            v-model="sort"
            class="cursor-pointer appearance-none bg-transparent py-2 pr-5 text-sm outline-none"
          >
            <option value="name">Name</option>
            <option value="updated">Updated</option>
          </select>
          <svg
            class="pointer-events-none absolute right-0 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </label>

        <div class="flex items-center gap-1" role="group" aria-label="Layout">
          <button
            type="button"
            class="p-1.5"
            :class="layout === 'list' ? 'text-[var(--ink)]' : 'text-[var(--muted)]'"
            :aria-pressed="layout === 'list'"
            aria-label="List layout"
            @click="setLayout('list')"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </button>
          <button
            type="button"
            class="p-1.5"
            :class="layout === 'grid' ? 'text-[var(--ink)]' : 'text-[var(--muted)]'"
            :aria-pressed="layout === 'grid'"
            aria-label="Grid layout"
            @click="setLayout('grid')"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="allTags.length" class="font-sans-ui mb-6 flex flex-wrap gap-x-3 gap-y-2 text-sm">
      <button
        type="button"
        class="transition-colors"
        :class="tag === 'all' ? 'text-[var(--ink)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'"
        @click="setTag('all')"
      >
        All topics
      </button>
      <button
        v-for="entry in allTags"
        :key="entry"
        type="button"
        class="transition-colors"
        :class="tag === entry ? 'text-[var(--ink)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'"
        @click="setTag(entry)"
      >
        {{ entry }}
      </button>
    </div>

    <p
      v-if="isFiltered && !pending && !error"
      class="font-sans-ui mb-4 text-xs text-[var(--muted)]"
    >
      {{ filtered.length }}
      {{ filtered.length === 1 ? "match" : "matches" }}
    </p>

    <p v-if="pending" class="font-sans-ui text-sm text-[var(--muted)]">Loading…</p>
    <div
      v-else-if="error"
      class="font-sans-ui border border-[var(--line)] px-4 py-5 text-sm text-[var(--muted)]"
      role="alert"
    >
      <p>Could not load entries from this deploy.</p>
      <p class="mt-2">
        Coolify may still be catching up with GitHub. Retry in a minute, or open a
        known item with
        <span class="font-mono-ui">?source=github</span>
        for a live preview.
      </p>
    </div>
    <div
      v-else-if="!filtered.length"
      class="font-sans-ui border border-[var(--line)] px-4 py-5 text-sm text-[var(--muted)]"
    >
      <p>{{ emptyLabel || "No matches." }}</p>
      <p v-if="!items.length" class="mt-2">
        If you just published, wait for Coolify to redeploy, or preview a file with
        <span class="font-mono-ui">?source=github</span>.
      </p>
      <p v-else-if="isFiltered" class="mt-2">
        Clear search or filters to see the full catalog.
      </p>
    </div>

    <ul
      v-else-if="layout === 'list'"
      class="divide-y divide-[var(--line)] border-y border-[var(--line)]"
    >
      <li v-for="item in filtered" :key="item.slug">
        <div
          class="group flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:px-2"
        >
          <NuxtLink :to="`${basePath}/${item.slug}`" class="min-w-0 flex-1">
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span class="text-xl font-semibold tracking-tight">{{ item.name }}</span>
              <span v-if="metaLine(item)" class="font-sans-ui text-xs text-[var(--muted)]">
                {{ metaLine(item) }}
              </span>
            </div>
            <p class="mt-1 max-w-2xl text-pretty text-[var(--muted)]">
              {{ item.whenToUse || item.description || "No description." }}
            </p>
            <p
              v-if="item.tags?.length"
              class="font-sans-ui mt-2 text-xs text-[var(--muted)]"
            >
              {{ item.tags.join(" · ") }}
            </p>
          </NuxtLink>
          <div class="font-sans-ui flex shrink-0 items-center gap-3">
            <button
              v-if="showInstall"
              type="button"
              class="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
              @click="copyInstall(item.slug, $event)"
            >
              {{ copiedSlug === item.slug ? "Copied" : "Copy install" }}
            </button>
            <span class="font-mono-ui text-xs text-[var(--muted)]">{{ item.slug }}</span>
          </div>
        </div>
      </li>
    </ul>

    <ul
      v-else
      class="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3"
    >
      <li v-for="item in filtered" :key="item.slug" class="bg-[var(--paper)]">
        <div class="flex h-full flex-col p-5">
          <NuxtLink :to="`${basePath}/${item.slug}`" class="min-w-0 flex-1">
            <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span class="text-lg font-semibold tracking-tight">{{ item.name }}</span>
              <span v-if="metaLine(item)" class="font-sans-ui text-xs text-[var(--muted)]">
                {{ metaLine(item) }}
              </span>
            </div>
            <p class="mt-2 line-clamp-3 text-pretty text-sm text-[var(--muted)]">
              {{ item.whenToUse || item.description || "No description." }}
            </p>
          </NuxtLink>
          <div class="mt-4 flex items-center justify-between gap-3">
            <span class="font-mono-ui text-xs text-[var(--muted)]">{{ item.slug }}</span>
            <button
              v-if="showInstall"
              type="button"
              class="font-sans-ui text-xs text-[var(--muted)] hover:text-[var(--ink)]"
              @click="copyInstall(item.slug, $event)"
            >
              {{ copiedSlug === item.slug ? "Copied" : "Install" }}
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
