<script setup lang="ts">
interface RelatedMeta {
  slug: string;
  name: string;
  description: string;
  whenToUse?: string | null;
  tags?: string[];
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

interface SkillDetail {
  slug: string;
  name: string;
  description: string;
  whenToUse?: string | null;
  category: string | null;
  tags?: string[];
  path: string;
  updatedAt: string | null;
  body: string;
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

const { data, error } = await useFetch<SkillDetail>(`/api/skills/${slug}`, {
  query,
});

if (error.value || !data.value) {
  throw createError({
    statusCode: 404,
    statusMessage:
      error.value?.statusMessage ||
      "Skill not found. If you just committed, try ?source=github or wait for Coolify.",
  });
}

useCatalogSeo({
  title: data.value.name,
  description: data.value.whenToUse || data.value.description,
  path: `/skills/${data.value.slug}`,
  type: "article",
});

const { command: installLine, copied, copyInstall } = useInstallCommand(
  () => data.value!.slug,
);
const { isStarred, toggleStar } = useStars();
</script>

<template>
  <article v-if="data">
    <nav class="font-sans-ui mb-8 text-sm text-[var(--muted)]">
      <NuxtLink to="/" class="hover:text-[var(--ink)]">Catalog</NuxtLink>
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
        :to="`/skills/${data.slug}?source=github`"
        class="ml-2 underline hover:text-[var(--ink)]"
      >
        Retry GitHub preview
      </NuxtLink>
    </p>

    <header class="mb-10 max-w-3xl border-b border-[var(--line)] pb-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <p
          v-if="data.category || data.tags?.length"
          class="font-sans-ui text-sm text-[var(--muted)]"
        >
          <span v-if="data.category">{{ data.category }}</span>
          <span v-if="data.category && data.tags?.length"> · </span>
          <span v-if="data.tags?.length">{{ data.tags.join(" · ") }}</span>
        </p>
        <button
          type="button"
          class="font-sans-ui text-sm text-[var(--muted)] hover:text-[var(--ink)]"
          @click="toggleStar({ kind: 'skills', slug: data.slug })"
        >
          {{
            isStarred({ kind: "skills", slug: data.slug }) ? "Starred" : "Star"
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

      <div class="font-sans-ui mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <code
          class="font-mono-ui flex-1 overflow-x-auto rounded-md border border-[var(--line)] px-3 py-2.5 text-sm"
        >
          {{ installLine }}
        </code>
        <button
          type="button"
          class="rounded-md bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-[var(--paper)]"
          @click="copyInstall"
        >
          {{ copied ? "Copied" : "Copy" }}
        </button>
      </div>
      <p class="font-mono-ui mt-3 text-xs text-[var(--muted)]">
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
      <h2 class="text-xl font-semibold tracking-tight">Related skills</h2>
      <ul class="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        <li v-for="item in data.related" :key="item.slug">
          <NuxtLink :to="`/skills/${item.slug}`" class="block py-4 sm:px-1">
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
