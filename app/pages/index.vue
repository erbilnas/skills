<script setup lang="ts">
interface SkillMeta {
  slug: string;
  name: string;
  description: string;
  category: string | null;
}

interface SkillsResponse {
  count: number;
  skills: SkillMeta[];
}

useSeoMeta({
  title: "Skills",
  description:
    "Browse agent skills by Erbil Nas. Search by name, description, or category.",
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
    </section>

    <CatalogList
      base-path="/skills"
      :items="data?.skills ?? []"
      :pending="pending"
      :error="Boolean(error)"
    />
  </div>
</template>
