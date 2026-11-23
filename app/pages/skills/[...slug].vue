<script setup lang="ts">
interface SkillDetail {
  slug: string;
  name: string;
  description: string;
  category: string | null;
  path: string;
  updatedAt: string | null;
  body: string;
  html: string;
}

const route = useRoute();
const slugParam = route.params.slug;
const slug = Array.isArray(slugParam)
  ? slugParam.join("/")
  : String(slugParam || "");

const { data, error } = await useFetch<SkillDetail>(
  `/api/skills/${slug}`,
);

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: "Skill not found" });
}

useSeoMeta({
  title: data.value.name,
  description: data.value.description,
});

const config = useRuntimeConfig();
const repo = config.public.githubRepo || "erbilnas/skills";
const installLine = `npx skills add ${repo}/${data.value.slug}`;

const copied = ref(false);

async function copyInstall() {
  try {
    await navigator.clipboard.writeText(installLine);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch {
    copied.value = false;
  }
}
</script>

<template>
  <article v-if="data">
    <nav class="font-sans-ui mb-8 text-sm text-[var(--muted)]">
      <NuxtLink to="/" class="hover:text-[var(--ink)]">Catalog</NuxtLink>
      <span class="mx-2">/</span>
      <span>{{ data.slug }}</span>
    </nav>

    <header class="mb-10 max-w-3xl border-b border-[var(--line)] pb-8">
      <p
        v-if="data.category"
        class="font-sans-ui mb-3 text-sm text-[var(--muted)]"
      >
        {{ data.category }}
      </p>
      <h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {{ data.name }}
      </h1>
      <p class="mt-4 text-lg text-pretty text-[var(--muted)]">
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
      </p>
    </header>

    <div class="skill-prose max-w-3xl" v-html="data.html" />
  </article>
</template>
