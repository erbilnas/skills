<script setup lang="ts">
interface RelatedMeta {
  slug: string;
  name: string;
  description: string;
  whenToUse?: string | null;
}

interface CatalogDetail {
  slug: string;
  name: string;
  description: string;
  whenToUse?: string | null;
  category: string | null;
  tags?: string[];
  path: string;
  source?: string | null;
  transport?: string | null;
  html: string;
  related?: RelatedMeta[];
  preview?: boolean;
  htmlUrl?: string;
}

const route = useRoute();
const slugParam = route.params.slug;
const slug = Array.isArray(slugParam)
  ? slugParam.join("/")
  : String(slugParam || "");

const query = computed(() =>
  route.query.source === "github" ? { source: "github" } : undefined,
);

const { data, error } = await useFetch<CatalogDetail>(`/api/mcps/${slug}`, {
  query,
});

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: "MCP not found" });
}

useCatalogSeo({
  title: data.value.name,
  description: data.value.whenToUse || data.value.description,
});

const metaLine = computed(() =>
  [
    data.value?.source,
    data.value?.transport,
    ...(data.value?.tags || []),
  ]
    .filter(Boolean)
    .join(" · "),
);
</script>

<template>
  <article v-if="data">
    <nav class="font-sans-ui mb-8 text-sm text-[var(--muted)]">
      <NuxtLink to="/mcps" class="hover:text-[var(--ink)]">MCPs</NuxtLink>
      <span class="mx-2">/</span>
      <span>{{ data.slug }}</span>
    </nav>

    <p
      v-if="data.preview"
      class="font-sans-ui mb-6 border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)]"
      role="status"
    >
      Live preview from GitHub
      <a
        v-if="data.htmlUrl"
        :href="data.htmlUrl"
        class="ml-2 underline hover:text-[var(--ink)]"
        rel="noopener noreferrer"
        target="_blank"
      >
        view file
      </a>
    </p>

    <header class="mb-10 max-w-3xl border-b border-[var(--line)] pb-8">
      <p v-if="metaLine" class="font-sans-ui mb-3 text-sm text-[var(--muted)]">
        {{ metaLine }}
      </p>
      <h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {{ data.name }}
      </h1>
      <p
        v-if="data.whenToUse"
        class="mt-4 text-lg text-pretty text-[var(--ink)]"
      >
        {{ data.whenToUse }}
      </p>
      <p
        class="mt-3 text-pretty text-[var(--muted)]"
        :class="data.whenToUse ? 'text-base' : 'mt-4 text-lg'"
      >
        {{ data.description }}
      </p>
      <p class="font-mono-ui mt-6 text-xs text-[var(--muted)]">
        {{ data.path }}
      </p>
    </header>

    <div class="skill-prose max-w-3xl" v-html="data.html" />

    <section
      v-if="data.related?.length"
      class="mt-14 max-w-3xl border-t border-[var(--line)] pt-10"
    >
      <h2 class="text-xl font-semibold tracking-tight">Related MCPs</h2>
      <ul class="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        <li v-for="item in data.related" :key="item.slug">
          <NuxtLink :to="`/mcps/${item.slug}`" class="block py-4 sm:px-1">
            <span class="font-medium">{{ item.name }}</span>
            <span class="mt-1 block text-sm text-[var(--muted)]">
              {{ item.whenToUse || item.description }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </article>
</template>
