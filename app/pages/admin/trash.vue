<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useCatalogSeo({
  title: "Trash",
  description: "Restore soft-deleted catalog items.",
  robots: "noindex, nofollow",
});

interface TrashItem {
  id: string;
  kind: string;
  slug: string;
  name: string;
  deletedAt: string;
  deletedBy: string;
}

const { data, pending, error, refresh } = await useFetch<{
  count: number;
  items: TrashItem[];
}>("/api/admin/trash");

const restoring = ref("");
const status = ref("");
const err = ref("");

async function restore(item: TrashItem) {
  restoring.value = `${item.kind}:${item.slug}:${item.id}`;
  err.value = "";
  status.value = "";
  try {
    const result = await $fetch<{ note: string; previewPath?: string }>(
      "/api/admin/trash/restore",
      {
        method: "POST",
        body: { kind: item.kind, slug: item.slug, id: item.id },
      },
    );
    status.value = result.note;
    await refresh();
  } catch (errorUnknown: unknown) {
    const fetchErr = errorUnknown as {
      data?: { statusMessage?: string };
      statusMessage?: string;
      message?: string;
    };
    err.value =
      fetchErr?.data?.statusMessage ||
      fetchErr?.statusMessage ||
      fetchErr?.message ||
      "Restore failed";
  } finally {
    restoring.value = "";
  }
}
</script>

<template>
  <div>
    <header class="mb-10">
      <h1 class="text-3xl font-semibold tracking-tight">Trash</h1>
      <p class="font-sans-ui mt-2 text-sm text-[var(--muted)]">
        Soft-deleted docs kept on GitHub under
        <span class="font-mono-ui">trash/</span>. Restore puts them back.
      </p>
    </header>

    <p v-if="err" class="font-sans-ui mb-4 text-sm" role="alert">{{ err }}</p>
    <p v-if="status" class="font-sans-ui mb-4 text-sm text-[var(--muted)]" role="status">
      {{ status }}
    </p>
    <p v-if="pending" class="font-sans-ui text-sm text-[var(--muted)]">Loading…</p>
    <p v-else-if="error" class="font-sans-ui text-sm" role="alert">
      Could not load trash.
    </p>
    <p
      v-else-if="!(data?.items?.length)"
      class="font-sans-ui text-sm text-[var(--muted)]"
    >
      Trash is empty.
    </p>
    <ul
      v-else
      class="divide-y divide-[var(--line)] border-y border-[var(--line)]"
    >
      <li
        v-for="item in data.items"
        :key="`${item.kind}:${item.slug}:${item.id}`"
        class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p class="font-medium">
            {{ item.name }}
            <span class="font-sans-ui ml-2 text-xs text-[var(--muted)]">
              {{ item.kind }}
            </span>
          </p>
          <p class="font-mono-ui text-xs text-[var(--muted)]">{{ item.slug }}</p>
          <p class="font-sans-ui mt-1 text-xs text-[var(--muted)]">
            {{ item.deletedBy }} ·
            {{ new Date(item.deletedAt).toLocaleString() }}
          </p>
        </div>
        <button
          type="button"
          class="font-sans-ui text-sm text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-50"
          :disabled="restoring === `${item.kind}:${item.slug}:${item.id}`"
          @click="restore(item)"
        >
          {{
            restoring === `${item.kind}:${item.slug}:${item.id}`
              ? "Restoring…"
              : "Restore"
          }}
        </button>
      </li>
    </ul>
  </div>
</template>
