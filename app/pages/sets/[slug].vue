<script setup lang="ts">
interface SetSkill {
  slug: string;
  name: string;
  description: string;
  whenToUse?: string | null;
  tags?: string[];
}

interface OtherSet {
  slug: string;
  name: string;
  description: string;
  count: number;
}

interface SetDetail {
  slug: string;
  name: string;
  description: string;
  count: number;
  skills: SetSkill[];
  others: OtherSet[];
}

const route = useRoute();
const slug = String(route.params.slug || "");

const { data, error } = await useFetch<SetDetail>(`/api/sets/${slug}`);

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: "Set not found" });
}

useCatalogSeo({
  title: data.value.name,
  description: data.value.description,
});

const config = useRuntimeConfig();
const repo = computed(() =>
  String(config.public.githubRepo || "erbilnas/skills").replace(/^\/|\/$/g, ""),
);

function installFor(skillSlug: string) {
  return `npx skills add ${repo.value}/${skillSlug}`;
}

const copiedSlug = ref("");
async function copyInstall(skillSlug: string) {
  try {
    await navigator.clipboard.writeText(installFor(skillSlug));
    copiedSlug.value = skillSlug;
    setTimeout(() => {
      if (copiedSlug.value === skillSlug) copiedSlug.value = "";
    }, 1400);
  } catch {
    copiedSlug.value = "";
  }
}
</script>

<template>
  <article v-if="data">
    <nav class="font-sans-ui mb-8 text-sm text-[var(--muted)]">
      <NuxtLink to="/sets" class="hover:text-[var(--ink)]">Sets</NuxtLink>
      <span class="mx-2">/</span>
      <span>{{ data.slug }}</span>
    </nav>

    <header class="mb-10 max-w-3xl border-b border-[var(--line)] pb-8">
      <p class="font-sans-ui mb-3 text-sm text-[var(--muted)]">
        {{ data.count }} skills
      </p>
      <h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {{ data.name }}
      </h1>
      <p class="mt-4 text-lg text-pretty text-[var(--muted)]">
        {{ data.description }}
      </p>
    </header>

    <ul class="divide-y divide-[var(--line)] border-y border-[var(--line)]">
      <li v-for="item in data.skills" :key="item.slug">
        <div
          class="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:px-2"
        >
          <NuxtLink :to="`/skills/${item.slug}`" class="min-w-0 flex-1">
            <span class="text-xl font-semibold tracking-tight">
              {{ item.name }}
            </span>
            <p class="mt-1 max-w-2xl text-pretty text-[var(--muted)]">
              {{ item.whenToUse || item.description || "No description." }}
            </p>
          </NuxtLink>
          <div class="font-sans-ui flex shrink-0 items-center gap-3">
            <button
              type="button"
              class="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
              @click="copyInstall(item.slug)"
            >
              {{ copiedSlug === item.slug ? "Copied" : "Copy install" }}
            </button>
            <span class="font-mono-ui text-xs text-[var(--muted)]">
              {{ item.slug }}
            </span>
          </div>
        </div>
      </li>
    </ul>

    <section
      v-if="data.others.length"
      class="mt-14 border-t border-[var(--line)] pt-10"
    >
      <h2 class="text-xl font-semibold tracking-tight">Other sets</h2>
      <ul class="mt-5 grid gap-4 sm:grid-cols-2">
        <li v-for="set in data.others" :key="set.slug">
          <NuxtLink :to="`/sets/${set.slug}`" class="group block py-1">
            <span class="font-medium group-hover:underline">{{ set.name }}</span>
            <span class="mt-0.5 block text-sm text-[var(--muted)]">
              {{ set.description }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </article>
</template>
