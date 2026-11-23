<script setup lang="ts">
interface CatalogMeta {
  slug: string;
  name: string;
  description: string;
  whenToUse?: string | null;
  category: string | null;
  tags?: string[];
  source?: string | null;
  alwaysApply?: boolean | null;
  updatedAt?: string | null;
}

interface CatalogResponse {
  count: number;
  items: CatalogMeta[];
  tags: string[];
  recent: CatalogMeta[];
}

useCatalogSeo({
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

    <section v-if="data?.recent?.length" class="mb-10">
      <h2 class="mb-3 text-sm font-semibold tracking-tight">Recently updated</h2>
      <ul class="font-sans-ui flex gap-4 overflow-x-auto pb-1 text-sm">
        <li v-for="item in data.recent" :key="item.slug" class="shrink-0">
          <NuxtLink
            :to="`/rules/${item.slug}`"
            class="text-[var(--muted)] hover:text-[var(--ink)]"
          >
            {{ item.name }}
          </NuxtLink>
        </li>
      </ul>
    </section>

    <CatalogList
      base-path="/rules"
      :items="data?.items ?? []"
      :tags="data?.tags"
      :pending="pending"
      :error="Boolean(error)"
    />
  </div>
</template>
