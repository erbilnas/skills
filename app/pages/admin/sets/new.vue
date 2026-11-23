<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useCatalogSeo({
  title: "New set",
  description: "Create a skill set.",
  robots: "noindex, nofollow",
});

const name = ref("");
const description = ref("");
const skills = ref("");
const body = ref("");
const draft = ref(false);
const isPrivate = ref(false);
const submitting = ref(false);
const message = ref("");
const errorMessage = ref("");
const dirty = ref(false);

watch([name, description, skills, body, draft, isPrivate], () => {
  dirty.value = true;
});

onBeforeRouteLeave((_to, _from, next) => {
  if (!dirty.value || submitting.value) {
    next();
    return;
  }
  next(window.confirm("You have unsaved changes. Leave anyway?"));
});

async function submit() {
  submitting.value = true;
  errorMessage.value = "";
  message.value = "";
  try {
    const result = await $fetch<{ note: string; slug: string }>(
      "/api/admin/sets",
      {
        method: "POST",
        body: {
          name: name.value,
          description: description.value,
          skills: skills.value,
          body: body.value,
          draft: draft.value,
          private: isPrivate.value,
        },
      },
    );
    dirty.value = false;
    message.value = result.note;
    await navigateTo(`/admin/sets/${result.slug}`);
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
        <p class="text-xs text-[var(--muted)]">New set</p>
        <h1 class="text-xl font-semibold tracking-tight">
          {{ name || "Untitled" }}
        </h1>
      </div>
      <div class="flex gap-2">
        <NuxtLink
          to="/admin/sets"
          class="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
        >
          Cancel
        </NuxtLink>
        <button
          type="button"
          class="rounded-md bg-[var(--ink)] px-3 py-2 text-sm font-medium text-[var(--paper)] disabled:opacity-50"
          :disabled="submitting"
          @click="submit"
        >
          {{ submitting ? "Saving…" : "Commit" }}
        </button>
      </div>
    </div>

    <form class="font-sans-ui space-y-5" @submit.prevent="submit">
      <label class="flex flex-col gap-1.5">
        <span class="text-xs text-[var(--muted)]">Slug</span>
        <input
          v-model="name"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          maxlength="64"
          class="rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--ink)]"
        />
      </label>
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
          Skill slugs (one per line or comma-separated, order kept)
        </span>
        <textarea
          v-model="skills"
          required
          rows="10"
          class="font-mono-ui rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
          placeholder="simple&#10;find-skills&#10;tdd"
        />
      </label>
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
