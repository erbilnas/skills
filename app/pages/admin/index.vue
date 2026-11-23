<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "admin",
});

useCatalogSeo({
  title: "Admin",
  description: "Manage skills, MCPs, rules, and sets.",
  robots: "noindex, nofollow",
});

const { data: me } = await useFetch<{ login: string }>("/api/admin/me");
const { data: skills } = await useFetch<{ count: number }>("/api/skills?all=1");
const { data: mcps } = await useFetch<{ count: number }>("/api/mcps?all=1");
const { data: rules } = await useFetch<{ count: number }>("/api/rules?all=1");
const { data: sets } = await useFetch<{ count: number }>("/api/admin/sets");

const cards = computed(() => [
  {
    to: "/admin/skills",
    label: "Skills",
    count: skills.value?.count ?? 0,
    hint: "Agent workflows",
  },
  {
    to: "/admin/mcps",
    label: "MCPs",
    count: mcps.value?.count ?? 0,
    hint: "Model context servers",
  },
  {
    to: "/admin/rules",
    label: "Rules",
    count: rules.value?.count ?? 0,
    hint: "Cursor rules",
  },
  {
    to: "/admin/sets",
    label: "Sets",
    count: sets.value?.count ?? 0,
    hint: "Curated packs",
  },
]);
</script>

<template>
  <div>
    <header class="mb-10">
      <p class="font-sans-ui text-sm text-[var(--muted)]">
        Signed in as {{ me?.login }}
      </p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p class="font-sans-ui mt-2 max-w-xl text-sm text-[var(--muted)]">
        Manage the catalog. Saves commit to GitHub; Coolify redeploy publishes
        the filesystem copy. Use live preview while waiting.
      </p>
    </header>

    <ul class="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
      <li v-for="card in cards" :key="card.to" class="bg-[var(--paper)]">
        <NuxtLink
          :to="card.to"
          class="block p-6 transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_3%,var(--paper))]"
        >
          <p class="font-sans-ui text-xs text-[var(--muted)]">{{ card.hint }}</p>
          <p class="mt-2 text-3xl font-semibold tracking-tight">{{ card.count }}</p>
          <p class="mt-1 text-lg font-medium">{{ card.label }}</p>
        </NuxtLink>
      </li>
    </ul>

    <section class="mt-10 border-t border-[var(--line)] pt-8">
      <h2 class="text-lg font-semibold tracking-tight">Quick actions</h2>
      <ul class="font-sans-ui mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <li>
          <NuxtLink
            to="/admin/skills/new"
            class="text-[var(--muted)] hover:text-[var(--ink)]"
          >
            New skill
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/admin/sets/new"
            class="text-[var(--muted)] hover:text-[var(--ink)]"
          >
            New set
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/admin/tools"
            class="text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Bulk re-import
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/" class="text-[var(--muted)] hover:text-[var(--ink)]">
            View catalog
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
