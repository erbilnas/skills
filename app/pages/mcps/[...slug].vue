<script setup lang="ts">
interface CatalogDetail {
  slug: string;
  name: string;
  description: string;
  category: string | null;
  path: string;
  source?: string | null;
  transport?: string | null;
  html: string;
}

const route = useRoute();
const slugParam = route.params.slug;
const slug = Array.isArray(slugParam)
  ? slugParam.join("/")
  : String(slugParam || "");

const { data, error } = await useFetch<CatalogDetail>(`/api/mcps/${slug}`);

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: "MCP not found" });
}

useSeoMeta({
  title: data.value.name,
  description: data.value.description,
});

const metaLine = computed(() =>
  [data.value?.source, data.value?.transport].filter(Boolean).join(" · "),
);
</script>

<template>
  <article v-if="data">
    <nav class="font-sans-ui mb-8 text-sm text-[var(--muted)]">
      <NuxtLink to="/mcps" class="hover:text-[var(--ink)]">MCPs</NuxtLink>
      <span class="mx-2">/</span>
      <span>{{ data.slug }}</span>
    </nav>

    <header class="mb-10 max-w-3xl border-b border-[var(--line)] pb-8">
      <p v-if="metaLine" class="font-sans-ui mb-3 text-sm text-[var(--muted)]">
        {{ metaLine }}
      </p>
      <h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {{ data.name }}
      </h1>
      <p class="mt-4 text-lg text-pretty text-[var(--muted)]">
        {{ data.description }}
      </p>
      <p class="font-mono-ui mt-6 text-xs text-[var(--muted)]">
        {{ data.path }}
      </p>
    </header>

    <div class="skill-prose max-w-3xl" v-html="data.html" />
  </article>
</template>
