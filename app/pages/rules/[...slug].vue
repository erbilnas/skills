<script setup lang="ts">
interface RelatedMeta {
  slug: string;
  name: string;
  description: string;
  whenToUse?: string | null;
}

interface UsedWithMeta {
  kind: "skills" | "mcps" | "rules";
  slug: string;
  name: string;
  description: string;
  whenToUse?: string | null;
}

interface ChangelogEntry {
  sha: string;
  message: string;
  date: string | null;
  url: string | null;
  author: string | null;
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
  alwaysApply?: boolean | null;
  html: string;
  related?: RelatedMeta[];
  usedWith?: UsedWithMeta[];
  changelog?: ChangelogEntry[];
  preview?: boolean;
  previewFailed?: boolean;
  deployLag?: string | null;
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

const { data, error } = await useFetch<CatalogDetail>(`/api/rules/${slug}`, {
  query,
});

if (error.value || !data.value) {
  throw createError({
    statusCode: 404,
    statusMessage:
      error.value?.statusMessage ||
      "Rule not found. If you just committed, try ?source=github or wait for Coolify.",
  });
}

useCatalogSeo({
  title: data.value.name,
  description: data.value.whenToUse || data.value.description,
  path: `/rules/${data.value.slug}`,
  type: "article",
});

const { isStarred, toggleStar } = useStars();

const metaLine = computed(() =>
  [
    data.value?.source,
    data.value?.alwaysApply ? "always apply" : null,
    ...(data.value?.tags || []),
  ]
    .filter(Boolean)
    .join(" · "),
);
</script>

<template>
  <article v-if="data">
    <nav class="font-sans-ui mb-8 text-sm text-[var(--muted)]">
      <NuxtLink to="/rules" class="hover:text-[var(--ink)]">Rules</NuxtLink>
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
    <p
      v-else-if="data.deployLag || data.previewFailed"
      class="font-sans-ui mb-6 border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)]"
      role="status"
    >
      {{ data.deployLag || "Showing the deployed filesystem copy." }}
      <NuxtLink
        :to="`/rules/${data.slug}?source=github`"
        class="ml-2 underline hover:text-[var(--ink)]"
      >
        Retry GitHub preview
      </NuxtLink>
    </p>

    <header class="mb-10 max-w-3xl border-b border-[var(--line)] pb-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <p v-if="metaLine" class="font-sans-ui text-sm text-[var(--muted)]">
          {{ metaLine }}
        </p>
        <button
          type="button"
          class="font-sans-ui text-sm text-[var(--muted)] hover:text-[var(--ink)]"
          @click="toggleStar({ kind: 'rules', slug: data.slug })"
        >
          {{
            isStarred({ kind: "rules", slug: data.slug }) ? "Starred" : "Star"
          }}
        </button>
      </div>
      <h1 class="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
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
        <span v-if="data.changelog?.[0]">
          · {{ data.changelog[0].sha }}
          {{ data.changelog[0].message }}
        </span>
      </p>
    </header>

    <div class="skill-prose max-w-3xl" v-html="data.html" />

    <section
      v-if="data.changelog?.length"
      class="mt-14 max-w-3xl border-t border-[var(--line)] pt-10"
    >
      <h2 class="text-xl font-semibold tracking-tight">Changelog</h2>
      <ul class="font-sans-ui mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm">
        <li v-for="entry in data.changelog" :key="entry.sha" class="py-3">
          <a
            v-if="entry.url"
            :href="entry.url"
            class="hover:text-[var(--ink)]"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span class="font-mono-ui text-xs text-[var(--muted)]">{{ entry.sha }}</span>
            <span class="ml-2">{{ entry.message }}</span>
          </a>
          <span v-else>
            <span class="font-mono-ui text-xs text-[var(--muted)]">{{ entry.sha }}</span>
            <span class="ml-2">{{ entry.message }}</span>
          </span>
          <span class="mt-1 block text-xs text-[var(--muted)]">
            {{ entry.author }}
            <span v-if="entry.date">
              · {{ new Date(entry.date).toLocaleDateString() }}
            </span>
          </span>
        </li>
      </ul>
    </section>

    <section
      v-if="data.usedWith?.length"
      class="mt-14 max-w-3xl border-t border-[var(--line)] pt-10"
    >
      <h2 class="text-xl font-semibold tracking-tight">Used with</h2>
      <ul class="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        <li v-for="item in data.usedWith" :key="`${item.kind}:${item.slug}`">
          <NuxtLink :to="`/${item.kind}/${item.slug}`" class="block py-4 sm:px-1">
            <span class="font-sans-ui text-xs text-[var(--muted)]">{{ item.kind }}</span>
            <span class="ml-2 font-medium">{{ item.name }}</span>
            <span class="mt-1 block text-sm text-[var(--muted)]">
              {{ item.whenToUse || item.description }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section
      v-if="data.related?.length"
      class="mt-14 max-w-3xl border-t border-[var(--line)] pt-10"
    >
      <h2 class="text-xl font-semibold tracking-tight">Related rules</h2>
      <ul class="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        <li v-for="item in data.related" :key="item.slug">
          <NuxtLink :to="`/rules/${item.slug}`" class="block py-4 sm:px-1">
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
