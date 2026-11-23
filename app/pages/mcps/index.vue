<script setup lang="ts">
interface CatalogMeta {
  slug: string;
  name: string;
  description: string;
  category: string | null;
  source?: string | null;
  transport?: string | null;
}

interface CatalogResponse {
  count: number;
  items: CatalogMeta[];
}

useSeoMeta({
  title: "MCPs",
  description: "Cursor MCP servers from my machine and plugins.",
});

const { data, pending, error } = await useFetch<CatalogResponse>("/api/mcps");
</script>

<template>
  <div>
    <section class="mb-12 max-w-2xl">
      <p class="font-sans-ui mb-3 text-sm text-[var(--muted)]">
        {{ data?.count ?? 0 }} MCPs
      </p>
      <h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        MCPs
      </h1>
      <p class="mt-4 text-lg text-pretty text-[var(--muted)]">
        Model Context Protocol servers from
        <span class="font-mono-ui text-base">~/.cursor/mcp.json</span>
        and Cursor plugins. Secrets are redacted.
      </p>
    </section>

    <CatalogList
      base-path="/mcps"
      :items="data?.items ?? []"
      :pending="pending"
      :error="Boolean(error)"
    />
  </div>
</template>
