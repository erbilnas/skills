<script setup lang="ts">
interface SkillMeta {
  slug: string;
  name: string;
  description: string;
  whenToUse?: string | null;
  category: string | null;
  tags?: string[];
  updatedAt?: string | null;
}

interface SkillsResponse {
  count: number;
  skills: SkillMeta[];
  tags: string[];
  recent: SkillMeta[];
}

useCatalogSeo({
  description:
    "Browse agent skills by Erbil Nas. Search by name, description, topic, or category.",
});

const { data, pending, error } = await useFetch<SkillsResponse>("/api/skills");
</script>

<template>
  <div>
    <section class="mb-12 max-w-2xl">
      <p class="font-sans-ui mb-3 text-sm text-[var(--muted)]">
        {{ data?.count ?? 0 }} skills
      </p>
      <h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Skills
      </h1>
      <p class="mt-4 text-lg text-pretty text-[var(--muted)]">
        Reusable agent workflows I keep on hand. Open one, copy the install
        line, get back to work.
      </p>
      <p class="font-sans-ui mt-4 text-sm text-[var(--muted)]">
        Prefer a pack?
        <NuxtLink to="/sets" class="text-[var(--ink)] hover:underline">
          Browse sets
        </NuxtLink>
      </p>
    </section>

    <section v-if="data?.recent?.length" class="mb-10">
      <div class="mb-3 flex items-baseline justify-between gap-4">
        <h2 class="text-sm font-semibold tracking-tight">Recently updated</h2>
        <NuxtLink
          to="/?sort=updated"
          class="font-sans-ui text-xs text-[var(--muted)] hover:text-[var(--ink)]"
        >
          Sort by updated
        </NuxtLink>
      </div>
      <ul class="font-sans-ui flex gap-4 overflow-x-auto pb-1 text-sm">
        <li
          v-for="item in data.recent"
          :key="item.slug"
          class="shrink-0"
        >
          <NuxtLink
            :to="`/skills/${item.slug}`"
            class="text-[var(--muted)] hover:text-[var(--ink)]"
          >
            {{ item.name }}
          </NuxtLink>
        </li>
      </ul>
    </section>

    <CatalogList
      base-path="/skills"
      :items="data?.skills ?? []"
      :tags="data?.tags"
      :pending="pending"
      :error="Boolean(error)"
      show-install
    />
  </div>
</template>
