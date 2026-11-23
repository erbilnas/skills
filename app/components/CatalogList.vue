<script setup lang="ts">
export interface CatalogRow {
  slug: string;
  name: string;
  description: string;
  category: string | null;
  source?: string | null;
  transport?: string | null;
  alwaysApply?: boolean | null;
}

type LayoutMode = "list" | "grid";

const props = defineProps<{
  basePath: string;
  items: CatalogRow[];
  pending?: boolean;
  error?: boolean;
  emptyLabel?: string;
}>();

const query = ref("");
const category = ref("all");
const layout = useCookie<LayoutMode>("catalog-layout", {
  default: () => "list",
  sameSite: "lax",
});

const categories = computed(() => {
  return [
    ...new Set(
      props.items
        .map((item) => item.category)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b));
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return props.items.filter((item) => {
    if (category.value !== "all" && item.category !== category.value) {
      return false;
    }
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.slug.toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q) ||
      (item.transport || "").toLowerCase().includes(q)
    );
  });
});

function metaLine(item: CatalogRow) {
  const bits = [
    item.category,
    item.transport,
    item.alwaysApply ? "always" : null,
  ].filter(Boolean);
  return bits.join(" · ");
}

function setLayout(mode: LayoutMode) {
  layout.value = mode;
}
</script>

<template>
  <div>
    <div class="font-sans-ui mb-8 flex flex-col gap-3 sm:flex-row sm:items-end">
      <label class="flex min-w-0 flex-1 flex-col gap-1.5">
        <span class="text-xs text-[var(--muted)]">Search</span>
        <input
          v-model="query"
          type="search"
          placeholder="Name, description, slug"
          class="w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 text-[var(--ink)] outline-none focus:border-[var(--ink)]"
        />
      </label>
      <label class="flex w-full flex-col gap-1.5 sm:w-48">
        <span class="text-xs text-[var(--muted)]">Filter</span>
        <select
          v-model="category"
          class="w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 text-[var(--ink)] outline-none focus:border-[var(--ink)]"
        >
          <option value="all">All</option>
          <option v-for="item in categories" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
      </label>
      <div class="flex flex-col gap-1.5">
        <span class="text-xs text-[var(--muted)]">Layout</span>
        <div
          class="flex items-center gap-1"
          role="group"
          aria-label="Catalog layout"
        >
          <button
            type="button"
            class="rounded-md border px-2.5 py-2.5 transition-colors"
            :class="
              layout === 'list'
                ? 'border-[var(--ink)] text-[var(--ink)]'
                : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]'
            "
            :aria-pressed="layout === 'list'"
            aria-label="List layout"
            @click="setLayout('list')"
          >
            <svg
              class="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </button>
          <button
            type="button"
            class="rounded-md border px-2.5 py-2.5 transition-colors"
            :class="
              layout === 'grid'
                ? 'border-[var(--ink)] text-[var(--ink)]'
                : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]'
            "
            :aria-pressed="layout === 'grid'"
            aria-label="Grid layout"
            @click="setLayout('grid')"
          >
            <svg
              class="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path
                d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <p v-if="pending" class="font-sans-ui text-sm text-[var(--muted)]">
      Loading…
    </p>
    <p
      v-else-if="error"
      class="font-sans-ui text-sm text-[var(--muted)]"
      role="alert"
    >
      Could not load entries.
    </p>
    <p
      v-else-if="!filtered.length"
      class="font-sans-ui text-sm text-[var(--muted)]"
    >
      {{ emptyLabel || "No matches." }}
    </p>

    <ul
      v-else-if="layout === 'list'"
      class="divide-y divide-[var(--line)] border-y border-[var(--line)]"
    >
      <li v-for="item in filtered" :key="item.slug">
        <NuxtLink
          :to="`${basePath}/${item.slug}`"
          class="group flex flex-col gap-1 py-5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04] sm:flex-row sm:items-baseline sm:justify-between sm:gap-8 sm:px-2"
        >
          <div class="min-w-0">
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span class="text-xl font-semibold tracking-tight">
                {{ item.name }}
              </span>
              <span
                v-if="metaLine(item)"
                class="font-sans-ui text-xs text-[var(--muted)]"
              >
                {{ metaLine(item) }}
              </span>
            </div>
            <p class="mt-1 max-w-2xl text-pretty text-[var(--muted)]">
              {{ item.description || "No description." }}
            </p>
          </div>
          <span
            class="font-mono-ui shrink-0 text-xs text-[var(--muted)] group-hover:text-[var(--ink)]"
          >
            {{ item.slug }}
          </span>
        </NuxtLink>
      </li>
    </ul>

    <ul
      v-else
      class="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3"
    >
      <li v-for="item in filtered" :key="item.slug" class="bg-[var(--paper)]">
        <NuxtLink
          :to="`${basePath}/${item.slug}`"
          class="group flex h-full flex-col gap-2 p-5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
        >
          <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span class="text-lg font-semibold tracking-tight">
              {{ item.name }}
            </span>
            <span
              v-if="metaLine(item)"
              class="font-sans-ui text-xs text-[var(--muted)]"
            >
              {{ metaLine(item) }}
            </span>
          </div>
          <p class="line-clamp-3 flex-1 text-pretty text-sm text-[var(--muted)]">
            {{ item.description || "No description." }}
          </p>
          <span
            class="font-mono-ui mt-2 text-xs text-[var(--muted)] group-hover:text-[var(--ink)]"
          >
            {{ item.slug }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
