<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "admin",
});

useCatalogSeo({
  title: "Admin",
  description: "Add or update skills in the catalog.",
  robots: "noindex, nofollow",
});

interface SkillMeta {
  slug: string;
  name: string;
  description: string;
}

const { data: me } = await useFetch<{ login: string }>("/api/admin/me");
const { data: catalog, refresh } = await useFetch<{
  skills: SkillMeta[];
}>("/api/skills");

const mode = ref<"create" | "edit">("create");
const name = ref("");
const description = ref("");
const body = ref("# New skill\n\nWrite instructions here.\n");
const editSlug = ref("");
const submitting = ref(false);
const message = ref("");
const errorMessage = ref("");

function resetCreate() {
  mode.value = "create";
  name.value = "";
  description.value = "";
  body.value = "# New skill\n\nWrite instructions here.\n";
  editSlug.value = "";
  message.value = "";
  errorMessage.value = "";
}

async function loadForEdit(slug: string) {
  errorMessage.value = "";
  message.value = "";
  try {
    const skill = await $fetch<{
      slug: string;
      name: string;
      description: string;
      body: string;
    }>(`/api/skills/${slug}`);
    mode.value = "edit";
    editSlug.value = skill.slug;
    name.value = skill.name;
    description.value = skill.description;
    body.value = skill.body;
  } catch {
    errorMessage.value = "Could not load that skill.";
  }
}

async function submit() {
  submitting.value = true;
  errorMessage.value = "";
  message.value = "";
  try {
    if (mode.value === "create") {
      const result = await $fetch<{ note: string; slug: string }>(
        "/api/admin/skills",
        {
          method: "POST",
          body: {
            name: name.value,
            description: description.value,
            body: body.value,
          },
        },
      );
      message.value = result.note;
      await refresh();
      name.value = "";
      description.value = "";
      body.value = "# New skill\n\nWrite instructions here.\n";
    } else {
      const result = await $fetch<{ note: string }>(
        `/api/admin/skills/${editSlug.value}`,
        {
          method: "PUT",
          body: {
            description: description.value,
            body: body.value,
          },
        },
      );
      message.value = result.note;
      await refresh();
    }
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
    <header class="mb-10">
      <p class="font-sans-ui text-sm text-[var(--muted)]">
        Signed in as {{ me?.login }}
      </p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight">
        {{ mode === "create" ? "Add a skill" : `Edit ${editSlug}` }}
      </h1>
      <p class="font-sans-ui mt-2 text-sm text-[var(--muted)]">
        Saves commit to GitHub. Coolify redeploy publishes the catalog.
      </p>
    </header>

    <form class="font-sans-ui space-y-5" @submit.prevent="submit">
      <label v-if="mode === 'create'" class="flex flex-col gap-1.5">
        <span class="text-xs text-[var(--muted)]">Name (folder slug)</span>
        <input
          v-model="name"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          maxlength="64"
          placeholder="my-skill"
          class="rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--ink)]"
        />
      </label>

      <label class="flex flex-col gap-1.5">
        <span class="text-xs text-[var(--muted)]">Description</span>
        <textarea
          v-model="description"
          required
          maxlength="1024"
          rows="3"
          class="rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--ink)]"
        />
      </label>

      <label class="flex flex-col gap-1.5">
        <span class="text-xs text-[var(--muted)]">Body (Markdown)</span>
        <textarea
          v-model="body"
          required
          rows="16"
          class="font-mono-ui rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
        />
      </label>

      <p v-if="errorMessage" class="text-sm" role="alert">{{ errorMessage }}</p>
      <p v-if="message" class="text-sm text-[var(--muted)]" role="status">
        {{ message }}
      </p>

      <div class="flex flex-wrap gap-3">
        <button
          type="submit"
          class="rounded-md bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-[var(--paper)] disabled:opacity-50"
          :disabled="submitting"
        >
          {{
            submitting
              ? "Saving…"
              : mode === "create"
                ? "Commit skill"
                : "Commit update"
          }}
        </button>
        <button
          v-if="mode === 'edit'"
          type="button"
          class="rounded-md border border-[var(--line)] px-4 py-2.5 text-sm"
          @click="resetCreate"
        >
          New skill
        </button>
      </div>
    </form>

    <section class="mt-14 border-t border-[var(--line)] pt-8">
      <h2 class="text-xl font-semibold tracking-tight">Existing</h2>
      <ul class="mt-4 divide-y divide-[var(--line)]">
        <li
          v-for="skill in catalog?.skills ?? []"
          :key="skill.slug"
          class="flex items-center justify-between gap-4 py-3"
        >
          <div class="min-w-0">
            <p class="truncate font-medium">{{ skill.name }}</p>
            <p class="font-mono-ui truncate text-xs text-[var(--muted)]">
              {{ skill.slug }}
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
            @click="loadForEdit(skill.slug)"
          >
            Edit
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
