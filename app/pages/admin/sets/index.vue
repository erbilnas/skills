<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useCatalogSeo({
  title: "Admin sets",
  description: "Manage curated skill sets.",
  robots: "noindex, nofollow",
});

interface SetMeta {
  slug: string;
  name: string;
  description: string;
  skills: string[];
  draft?: boolean;
  private?: boolean;
}

const { data, pending, error, refresh } = await useFetch<{
  count: number;
  sets: SetMeta[];
}>("/api/admin/sets");

const query = ref("");
const deletingSlug = ref("");
const deleteError = ref("");

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  const sets = data.value?.sets || [];
  if (!q) return sets;
  return sets.filter(
    (set) =>
      set.name.toLowerCase().includes(q) ||
      set.slug.toLowerCase().includes(q) ||
      set.description.toLowerCase().includes(q) ||
      set.skills.some((slug) => slug.includes(q)),
  );
});

async function removeSet(set: SetMeta) {
  const ok = window.confirm(`Delete set “${set.name}” from GitHub?`);
  if (!ok) return;
  deletingSlug.value = set.slug;
  deleteError.value = "";
  try {
    await $fetch(`/api/admin/sets/${set.slug}`, { method: "DELETE" });
    await refresh();
  } catch (err: unknown) {
    const fetchErr = err as {
      data?: { statusMessage?: string };
      statusMessage?: string;
      message?: string;
    };
    deleteError.value =
      fetchErr?.data?.statusMessage ||
      fetchErr?.statusMessage ||
      fetchErr?.message ||
      "Delete failed";
  } finally {
    deletingSlug.value = "";
  }
}
</script>

<template>
  <div>
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Sets</h1>
        <p class="font-sans-ui mt-2 text-sm text-[var(--muted)]">
          {{ filtered.length }} of {{ data?.count ?? 0 }} curated packs
        </p>
      </div>
      <NuxtLink
        to="/admin/sets/new"
        class="font-sans-ui inline-flex rounded-md bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-[var(--paper)]"
      >
        New set
      </NuxtLink>
    </div>

    <label class="font-sans-ui mb-6 block border-b border-[var(--line)] pb-4">
      <span class="sr-only">Search</span>
      <input
        v-model="query"
        type="search"
        placeholder="Search sets…"
        class="w-full bg-transparent py-2 outline-none placeholder:text-[var(--muted)]"
      />
    </label>

    <p v-if="deleteError" class="font-sans-ui mb-4 text-sm" role="alert">
      {{ deleteError }}
    </p>
    <p v-if="pending" class="font-sans-ui text-sm text-[var(--muted)]">Loading…</p>
    <p v-else-if="error" class="font-sans-ui text-sm" role="alert">
      Could not load sets.
    </p>
    <div
      v-else-if="!filtered.length"
      class="font-sans-ui border border-[var(--line)] px-5 py-10 text-center text-[var(--muted)]"
    >
      No sets yet.
      <NuxtLink to="/admin/sets/new" class="mt-4 block text-[var(--ink)] underline">
        Add first set
      </NuxtLink>
    </div>

    <ul
      v-else
      class="divide-y divide-[var(--line)] border-y border-[var(--line)]"
    >
      <li
        v-for="set in filtered"
        :key="set.slug"
        class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <p class="font-medium">
            {{ set.name }}
            <span class="font-sans-ui ml-2 text-xs font-normal text-[var(--muted)]">
              {{ set.skills.length }} skills
            </span>
          </p>
          <p class="mt-1 text-sm text-[var(--muted)]">{{ set.description }}</p>
          <p class="font-mono-ui mt-1 truncate text-xs text-[var(--muted)]">
            {{ set.skills.slice(0, 6).join(" · ") }}
            <span v-if="set.skills.length > 6"> · …</span>
          </p>
        </div>
        <div class="font-sans-ui flex shrink-0 gap-3 text-sm">
          <NuxtLink
            :to="`/sets/${set.slug}`"
            class="text-[var(--muted)] hover:text-[var(--ink)]"
            target="_blank"
          >
            View
          </NuxtLink>
          <NuxtLink
            :to="`/admin/sets/${set.slug}`"
            class="text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Edit
          </NuxtLink>
          <button
            type="button"
            class="text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-50"
            :disabled="deletingSlug === set.slug"
            @click="removeSet(set)"
          >
            {{ deletingSlug === set.slug ? "Deleting…" : "Delete" }}
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
