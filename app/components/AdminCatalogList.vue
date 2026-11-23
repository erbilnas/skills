<script setup lang="ts">
import type { AdminCatalogKind, AdminCatalogMeta } from "~/composables/useAdminCatalog";
import { kindLabel, kindTitle } from "~/composables/useAdminCatalog";

const props = defineProps<{
  kind: AdminCatalogKind;
  entries: AdminCatalogMeta[];
  tags?: string[];
  pending?: boolean;
  error?: boolean;
}>();

const emit = defineEmits<{
  deleted: [];
}>();

const query = ref("");
const visibility = ref<"all" | "public" | "draft" | "private">("all");
const tag = ref("all");
const deletingSlug = ref("");
const deleteError = ref("");

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return props.entries.filter((item) => {
    if (visibility.value === "draft" && !item.draft) return false;
    if (visibility.value === "private" && !item.private) return false;
    if (visibility.value === "public" && (item.draft || item.private)) return false;
    if (tag.value !== "all" && !(item.tags || []).includes(tag.value)) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.slug.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.whenToUse || "").toLowerCase().includes(q) ||
      (item.tags || []).some((entry) => entry.includes(q))
    );
  });
});

async function removeItem(item: AdminCatalogMeta) {
  const ok = window.confirm(
    `Delete “${item.name}” from GitHub? This cannot be undone from the admin UI.`,
  );
  if (!ok) return;
  deletingSlug.value = item.slug;
  deleteError.value = "";
  try {
    await $fetch(`/api/admin/catalog/${props.kind}/${item.slug}`, {
      method: "DELETE",
    });
    emit("deleted");
  } catch (err: unknown) {
    const fetchErr = err as {
      data?: { statusMessage?: string };
      statusMessage?: string;
      message?: string;
    };
    deleteError.value =
      fetchErr?.data?.statusMessage ||
      fetchErr?.statusMessage ||
      fetchErr?.message ||
      "Delete failed";
  } finally {
    deletingSlug.value = "";
  }
}

function statusLine(item: AdminCatalogMeta) {
  return [item.draft ? "draft" : null, item.private ? "private" : null]
    .filter(Boolean)
    .join(" · ");
}
</script>

<template>
  <div>
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">
          {{ kindTitle(kind) }}
        </h1>
        <p class="font-sans-ui mt-2 text-sm text-[var(--muted)]">
          {{ filtered.length }} of {{ entries.length }}
          {{ kindLabel(kind) }}{{ entries.length === 1 ? "" : "s" }}
        </p>
      </div>
      <NuxtLink
        :to="`/admin/${kind}/new`"
        class="font-sans-ui inline-flex rounded-md bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-[var(--paper)]"
      >
        New {{ kindLabel(kind) }}
      </NuxtLink>
    </div>

    <div
      class="font-sans-ui mb-6 flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center"
    >
      <label class="min-w-0 flex-1">
        <span class="sr-only">Search</span>
        <input
          v-model="query"
          type="search"
          placeholder="Search name, slug, tags…"
          class="w-full bg-transparent py-2 outline-none placeholder:text-[var(--muted)]"
        />
      </label>
      <div class="flex flex-wrap items-center gap-3 text-sm">
        <select
          v-model="visibility"
          class="cursor-pointer appearance-none bg-transparent py-2 pr-1 outline-none"
        >
          <option value="all">All visibility</option>
          <option value="public">Public</option>
          <option value="draft">Draft</option>
          <option value="private">Private</option>
        </select>
        <select
          v-if="tags?.length"
          v-model="tag"
          class="max-w-[10rem] cursor-pointer appearance-none bg-transparent py-2 pr-1 outline-none"
        >
          <option value="all">All tags</option>
          <option v-for="entry in tags" :key="entry" :value="entry">
            {{ entry }}
          </option>
        </select>
      </div>
    </div>

    <p v-if="deleteError" class="font-sans-ui mb-4 text-sm" role="alert">
      {{ deleteError }}
    </p>
    <p v-if="pending" class="font-sans-ui text-sm text-[var(--muted)]">Loading…</p>
    <p v-else-if="error" class="font-sans-ui text-sm" role="alert">
      Could not load entries.
    </p>
    <div
      v-else-if="!filtered.length"
      class="font-sans-ui border border-[var(--line)] px-5 py-10 text-center"
    >
      <p class="text-[var(--muted)]">
        {{
          entries.length
            ? "No matches."
            : `No ${kindLabel(kind)}s yet.`
        }}
      </p>
      <NuxtLink
        v-if="!entries.length"
        :to="`/admin/${kind}/new`"
        class="mt-4 inline-block text-[var(--ink)] underline"
      >
        Add first {{ kindLabel(kind) }}
      </NuxtLink>
    </div>

    <ul
      v-else
      class="divide-y divide-[var(--line)] border-y border-[var(--line)]"
    >
      <li
        v-for="item in filtered"
        :key="item.slug"
        class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      >
        <div class="min-w-0">
          <p class="truncate font-medium">
            {{ item.name }}
            <span
              v-if="statusLine(item)"
              class="font-sans-ui ml-2 text-xs font-normal text-[var(--muted)]"
            >
              {{ statusLine(item) }}
            </span>
          </p>
          <p class="font-mono-ui truncate text-xs text-[var(--muted)]">
            {{ item.slug }}
          </p>
          <p class="mt-1 line-clamp-1 text-sm text-[var(--muted)]">
            {{ item.whenToUse || item.description }}
          </p>
        </div>
        <div class="font-sans-ui flex shrink-0 flex-wrap items-center gap-3 text-sm">
          <NuxtLink
            :to="`/${kind}/${item.slug}?source=github`"
            class="text-[var(--muted)] hover:text-[var(--ink)]"
            target="_blank"
          >
            Preview
          </NuxtLink>
          <NuxtLink
            :to="`/admin/${kind}/${item.slug}`"
            class="text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Edit
          </NuxtLink>
          <button
            type="button"
            class="text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-50"
            :disabled="deletingSlug === item.slug"
            @click="removeItem(item)"
          >
            {{ deletingSlug === item.slug ? "Deleting…" : "Delete" }}
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
