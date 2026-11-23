<script setup lang="ts">
interface SetSkill {
  slug: string;
  name: string;
  description: string;
  whenToUse?: string | null;
}

interface SkillSet {
  slug: string;
  name: string;
  description: string;
  count: number;
  skills: SetSkill[];
}

interface SetsResponse {
  count: number;
  sets: SkillSet[];
}

useCatalogSeo({
  title: "Sets",
  description: "Curated packs of agent skills for common jobs.",
});

const { data, pending, error } = await useFetch<SetsResponse>("/api/sets");
</script>

<template>
  <div>
    <section class="mb-12 max-w-2xl">
      <p class="font-sans-ui mb-3 text-sm text-[var(--muted)]">
        {{ data?.count ?? 0 }} sets
      </p>
      <h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Sets
      </h1>
      <p class="mt-4 text-lg text-pretty text-[var(--muted)]">
        Curated packs of skills for a job. Start with Starter, then pick a
        lane.
      </p>
    </section>

    <p v-if="pending" class="font-sans-ui text-sm text-[var(--muted)]">
      Loading…
    </p>
    <p
      v-else-if="error"
      class="font-sans-ui text-sm text-[var(--muted)]"
      role="alert"
    >
      Could not load sets.
    </p>

    <ul
      v-else
      class="divide-y divide-[var(--line)] border-y border-[var(--line)]"
    >
      <li v-for="set in data?.sets ?? []" :key="set.slug">
        <NuxtLink
          :to="`/sets/${set.slug}`"
          class="group flex flex-col gap-3 py-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:px-2"
        >
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span class="text-xl font-semibold tracking-tight">
                {{ set.name }}
              </span>
              <span class="font-sans-ui text-xs text-[var(--muted)]">
                {{ set.count }} skills
              </span>
            </div>
            <p class="mt-1 max-w-2xl text-pretty text-[var(--muted)]">
              {{ set.description }}
            </p>
            <p class="font-sans-ui mt-3 text-sm text-[var(--muted)]">
              {{
                set.skills
                  .slice(0, 5)
                  .map((skill) => skill.name)
                  .join(" · ")
              }}
              <span v-if="set.skills.length > 5"> · …</span>
            </p>
          </div>
          <span
            class="font-sans-ui shrink-0 text-sm text-[var(--muted)] group-hover:text-[var(--ink)]"
          >
            Open
          </span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
