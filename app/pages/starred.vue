<script setup lang="ts">
useCatalogSeo({
  title: "Starred",
  description: "Your starred skills, MCPs, rules, and sets.",
  path: "/starred",
});

const { stars, toggleStar } = useStars();

const grouped = computed(() => {
  const map: Record<string, typeof stars.value> = {
    skills: [],
    mcps: [],
    rules: [],
    sets: [],
  };
  for (const item of stars.value || []) {
    map[item.kind]?.push(item);
  }
  return map;
});
</script>

<template>
  <div>
    <section class="mb-12 max-w-2xl">
      <h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Starred
      </h1>
      <p class="mt-4 text-lg text-pretty text-[var(--muted)]">
        Personal pins saved in this browser.
      </p>
    </section>

    <p
      v-if="!(stars?.length)"
      class="font-sans-ui text-sm text-[var(--muted)]"
    >
      Nothing starred yet. Open a skill, set, MCP, or rule and hit Star.
    </p>

    <div v-else class="space-y-10">
      <section v-for="(items, kind) in grouped" :key="kind">
        <template v-if="items.length">
          <h2 class="text-lg font-semibold tracking-tight capitalize">{{ kind }}</h2>
          <ul class="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            <li
              v-for="item in items"
              :key="`${item.kind}:${item.slug}`"
              class="flex items-center justify-between gap-4 py-4"
            >
              <NuxtLink
                :to="`/${item.kind === 'sets' ? 'sets' : item.kind}/${item.slug}`"
                class="font-medium hover:underline"
              >
                {{ item.slug }}
              </NuxtLink>
              <button
                type="button"
                class="font-sans-ui text-sm text-[var(--muted)] hover:text-[var(--ink)]"
                @click="toggleStar(item)"
              >
                Unstar
              </button>
            </li>
          </ul>
        </template>
      </section>
    </div>
  </div>
</template>
