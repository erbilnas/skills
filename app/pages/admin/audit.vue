<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useCatalogSeo({
  title: "Audit log",
  description: "Recent admin commits and actions.",
  robots: "noindex, nofollow",
});

interface AuditItem {
  at: string;
  actor: string;
  action: string;
  kind?: string;
  slug?: string;
  path?: string;
  detail?: string;
}

const { data, pending, error } = await useFetch<{
  count: number;
  items: AuditItem[];
}>("/api/admin/audit");
</script>

<template>
  <div>
    <header class="mb-10">
      <h1 class="text-3xl font-semibold tracking-tight">Audit log</h1>
      <p class="font-sans-ui mt-2 text-sm text-[var(--muted)]">
        Recent admin actions from
        <span class="font-mono-ui">audit/log.jsonl</span>
        on GitHub.
      </p>
    </header>

    <p v-if="pending" class="font-sans-ui text-sm text-[var(--muted)]">Loading…</p>
    <p v-else-if="error" class="font-sans-ui text-sm" role="alert">
      Could not load audit log. Commit an admin action first, or check GitHub write config.
    </p>
    <p
      v-else-if="!(data?.items?.length)"
      class="font-sans-ui text-sm text-[var(--muted)]"
    >
      No audit entries yet.
    </p>
    <ul
      v-else
      class="font-sans-ui divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm"
    >
      <li v-for="(item, index) in data.items" :key="`${item.at}-${index}`" class="py-3">
        <p>
          <span class="font-medium">{{ item.action }}</span>
          <span v-if="item.kind" class="text-[var(--muted)]"> · {{ item.kind }}</span>
          <span v-if="item.slug" class="font-mono-ui text-xs"> {{ item.slug }}</span>
        </p>
        <p class="mt-1 text-xs text-[var(--muted)]">
          {{ item.actor }} · {{ new Date(item.at).toLocaleString() }}
          <span v-if="item.detail"> · {{ item.detail }}</span>
        </p>
      </li>
    </ul>
  </div>
</template>
