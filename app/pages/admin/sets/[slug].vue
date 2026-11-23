<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });

const route = useRoute();
const slug = String(route.params.slug || "");

useCatalogSeo({
  title: `Edit set ${slug}`,
  description: "Edit a skill set.",
  robots: "noindex, nofollow",
});

const description = ref("");
const skills = ref("");
const body = ref("");
const draft = ref(false);
const isPrivate = ref(false);
const submitting = ref(false);
const loading = ref(true);
const message = ref("");
const errorMessage = ref("");
const dirty = ref(false);
const name = ref(slug);

const { data: skillCatalog } = await useFetch<{
  skills?: Array<{ slug: string; name: string }>;
  items?: Array<{ slug: string; name: string }>;
}>("/api/skills?all=1");

const skillOptions = computed(
  () => skillCatalog.value?.skills || skillCatalog.value?.items || [],
);

onMounted(async () => {
  try {
    const item = await $fetch<{
      name: string;
      description: string;
      skills: string[];
      body: string;
      draft?: boolean;
      private?: boolean;
    }>(`/api/admin/sets/${slug}`);
    name.value = item.name;
    description.value = item.description;
    skills.value = item.skills.join("\n");
    body.value = item.body || "";
    draft.value = Boolean(item.draft);
    isPrivate.value = Boolean(item.private);
    dirty.value = false;
  } catch {
    errorMessage.value = "Could not load that set.";
  } finally {
    loading.value = false;
  }
});

watch([description, skills, body, draft, isPrivate], () => {
  dirty.value = true;
});

onBeforeRouteLeave((_to, _from, next) => {
  if (!dirty.value || submitting.value) {
    next();
    return;
  }
  next(window.confirm("You have unsaved changes. Leave anyway?"));
});

function appendSkill(skillSlug: string) {
  const lines = skills.value
    .split(/[,|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.includes(skillSlug)) return;
  lines.push(skillSlug);
  skills.value = lines.join("\n");
}

async function submit() {
  submitting.value = true;
  errorMessage.value = "";
  message.value = "";
  try {
    const result = await $fetch<{ note: string }>(`/api/admin/sets/${slug}`, {
      method: "PUT",
      body: {
        description: description.value,
        skills: skills.value,
        body: body.value,
        draft: draft.value,
        private: isPrivate.value,
      },
    });
    dirty.value = false;
    message.value = result.note;
  } catch (err: unknown) {
    const fetchErr = err as {
      data?: { statusMessage?: string };
      statusMessage?: string;
      message?: string;
    };
    errorMessage.value =
      fetchErr?.data?.statusMessage ||
      fetchErr?.statusMessage ||
      fetchErr?.message ||
      "Save failed";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <div
      class="font-sans-ui sticky top-[57px] z-10 -mx-5 mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-5 py-3 sm:-mx-8 sm:px-8"
    >
      <div>
        <p class="text-xs text-[var(--muted)]">
          Edit set
          <span v-if="dirty"> · unsaved</span>
        </p>
        <h1 class="text-xl font-semibold tracking-tight">{{ name }}</h1>
      </div>
      <div class="flex gap-2">
        <NuxtLink
          to="/admin/sets"
          class="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
        >
          Cancel
        </NuxtLink>
        <NuxtLink
          :to="`/sets/${slug}`"
          class="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
          target="_blank"
        >
          View
        </NuxtLink>
        <button
          type="button"
          class="rounded-md bg-[var(--ink)] px-3 py-2 text-sm font-medium text-[var(--paper)] disabled:opacity-50"
          :disabled="submitting || loading"
          @click="submit"
        >
          {{ submitting ? "Saving…" : "Commit" }}
        </button>
      </div>
    </div>

    <p v-if="loading" class="font-sans-ui text-sm text-[var(--muted)]">Loading…</p>

    <form
      v-else
      class="font-sans-ui space-y-5"
      @submit.prevent="submit"
    >
      <label class="flex flex-col gap-1.5">
        <span class="text-xs text-[var(--muted)]">Description</span>
        <textarea
          v-model="description"
          required
          rows="2"
          class="rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--ink)]"
        />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-xs text-[var(--muted)]">
          Skill slugs (one per line, order kept)
        </span>
        <textarea
          v-model="skills"
          required
          rows="12"
          class="font-mono-ui rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
        />
      </label>

      <div v-if="skillOptions.length" class="space-y-2">
        <p class="text-xs text-[var(--muted)]">Quick add from catalog</p>
        <div class="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
          <button
            v-for="skill in skillOptions"
            :key="skill.slug"
            type="button"
            class="rounded border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--ink)]"
            @click="appendSkill(skill.slug)"
          >
            {{ skill.slug }}
          </button>
        </div>
      </div>

      <label class="flex flex-col gap-1.5">
        <span class="text-xs text-[var(--muted)]">Notes (optional markdown)</span>
        <textarea
          v-model="body"
          rows="4"
          class="font-mono-ui rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
        />
      </label>
      <div class="flex flex-wrap gap-5 text-sm">
        <label class="flex items-center gap-2">
          <input v-model="draft" type="checkbox" class="size-4" />
          Draft
        </label>
        <label class="flex items-center gap-2">
          <input v-model="isPrivate" type="checkbox" class="size-4" />
          Private
        </label>
      </div>
      <p v-if="errorMessage" class="text-sm" role="alert">{{ errorMessage }}</p>
      <p v-if="message" class="text-sm text-[var(--muted)]" role="status">
        {{ message }}
      </p>
    </form>
  </div>
</template>
