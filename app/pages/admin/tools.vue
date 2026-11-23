<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useCatalogSeo({
  title: "Admin tools",
  description: "Bulk import and maintenance.",
  robots: "noindex, nofollow",
});

const importing = ref(false);
const message = ref("");
const errorMessage = ref("");
const committed = ref<string[]>([]);

async function runImport() {
  const ok = window.confirm(
    "Re-import all skills from ~/.agents/skills (or SKILLS_SOURCE) and commit each SKILL.md to GitHub?",
  );
  if (!ok) return;

  importing.value = true;
  errorMessage.value = "";
  message.value = "";
  committed.value = [];
  try {
    const result = await $fetch<{
      note: string;
      count: number;
      committed: string[];
      source: string;
    }>("/api/admin/import-skills", { method: "POST" });
    message.value = `${result.note} (${result.count} from ${result.source})`;
    committed.value = result.committed || [];
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
      "Import failed";
  } finally {
    importing.value = false;
  }
}
</script>

<template>
  <div>
    <header class="mb-10">
      <h1 class="text-3xl font-semibold tracking-tight">Tools</h1>
      <p class="font-sans-ui mt-2 max-w-xl text-sm text-[var(--muted)]">
        Maintenance actions that commit to GitHub. Prefer these on a machine
        that can read the local skills source; Coolify may return 503 without
        <span class="font-mono-ui">SKILLS_SOURCE</span>
        mounted.
      </p>
    </header>

    <section class="border border-[var(--line)] p-6">
      <h2 class="text-lg font-semibold tracking-tight">Bulk re-import skills</h2>
      <p class="font-sans-ui mt-2 text-sm text-[var(--muted)]">
        Copy from
        <span class="font-mono-ui">~/.agents/skills</span>
        (or
        <span class="font-mono-ui">SKILLS_SOURCE</span>
        ) into
        <span class="font-mono-ui">./skills</span>
        and commit each
        <span class="font-mono-ui">SKILL.md</span>.
      </p>
      <button
        type="button"
        class="font-sans-ui mt-5 rounded-md bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-[var(--paper)] disabled:opacity-50"
        :disabled="importing"
        @click="runImport"
      >
        {{ importing ? "Importing…" : "Re-import skills" }}
      </button>

      <p v-if="errorMessage" class="font-sans-ui mt-4 text-sm" role="alert">
        {{ errorMessage }}
      </p>
      <p
        v-if="message"
        class="font-sans-ui mt-4 text-sm text-[var(--muted)]"
        role="status"
      >
        {{ message }}
      </p>
      <ul
        v-if="committed.length"
        class="font-mono-ui mt-4 max-h-64 overflow-y-auto text-xs text-[var(--muted)]"
      >
        <li v-for="entry in committed" :key="entry">{{ entry }}</li>
      </ul>
    </section>
  </div>
</template>
