<script setup lang="ts">
interface CatalogMeta {
  slug: string;
  name: string;
  description: string;
  category: string | null;
  source?: string | null;
  alwaysApply?: boolean | null;
}

interface CatalogResponse {
  count: number;
  items: CatalogMeta[];
}

useSeoMeta({
  title: "Rules",
  description: "Cursor user rules and plugin rules from my setup.",
});

const { data, pending, error } = await useFetch<CatalogResponse>("/api/rules");
</script>

<template>
  <div>
    <section class="mb-12 max-w-2xl">
      <p class="font-sans-ui mb-3 text-sm text-[var(--muted)]">
        {{ data?.count ?? 0 }} rules
      </p>
      <h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Rules
      </h1>
      <p class="mt-4 text-lg text-pretty text-[var(--muted)]">
        Personal Cursor rules plus plugin
        <span class="font-mono-ui text-base">.mdc</span>
        rules I actually keep around.
      </p>
    </section>

    <CatalogList
      base-path="/rules"
      :items="data?.items ?? []"
      :pending="pending"
      :error="Boolean(error)"
    />
  </div>
</template>
