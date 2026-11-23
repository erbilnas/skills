<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useCatalogSeo({
  title: "Admin tools",
  description: "Import and maintenance tools.",
  robots: "noindex, nofollow",
});

type CatalogKind = "skills" | "mcps" | "rules";

interface ImportResult {
  note: string;
  slug: string;
  kind: string;
  previewPath?: string;
  overwritten?: boolean;
  count?: number;
  committed?: string[];
  source?: string;
}

const busy = ref(false);
const message = ref("");
const errorMessage = ref("");
const previewPath = ref("");
const committed = ref<string[]>([]);

const githubUrl = ref("");
const githubKind = ref<CatalogKind | "">("");
const githubSlug = ref("");
const githubOverwrite = ref(false);

const pasteContent = ref("");
const pasteKind = ref<CatalogKind>("skills");
const pasteSlug = ref("");
const pasteOverwrite = ref(false);

const uploadKind = ref<CatalogKind | "">("");
const uploadSlug = ref("");
const uploadOverwrite = ref(false);
const uploadInput = ref<HTMLInputElement | null>(null);

function resetStatus() {
  message.value = "";
  errorMessage.value = "";
  previewPath.value = "";
  committed.value = [];
}

function explainError(err: unknown) {
  const fetchErr = err as {
    data?: { statusMessage?: string };
    statusMessage?: string;
    message?: string;
  };
  return (
    fetchErr?.data?.statusMessage ||
    fetchErr?.statusMessage ||
    fetchErr?.message ||
    "Request failed"
  );
}

async function runBulkImport() {
  const ok = window.confirm(
    "Re-import all skills from ~/.agents/skills (or SKILLS_SOURCE) and commit each SKILL.md to GitHub?",
  );
  if (!ok) return;

  busy.value = true;
  resetStatus();
  try {
    const result = await $fetch<ImportResult>("/api/admin/import-skills", {
      method: "POST",
    });
    message.value = `${result.note} (${result.count} from ${result.source})`;
    committed.value = result.committed || [];
  } catch (err) {
    errorMessage.value = explainError(err);
  } finally {
    busy.value = false;
  }
}

async function runGithubImport() {
  busy.value = true;
  resetStatus();
  try {
    const result = await $fetch<ImportResult>("/api/admin/import-github", {
      method: "POST",
      body: {
        url: githubUrl.value,
        kind: githubKind.value || undefined,
        slug: githubSlug.value || undefined,
        overwrite: githubOverwrite.value,
      },
    });
    message.value = `${result.note} → ${result.kind}/${result.slug}`;
    previewPath.value = result.previewPath || "";
  } catch (err) {
    errorMessage.value = explainError(err);
  } finally {
    busy.value = false;
  }
}

async function runPasteImport() {
  busy.value = true;
  resetStatus();
  try {
    const result = await $fetch<ImportResult>("/api/admin/import-paste", {
      method: "POST",
      body: {
        content: pasteContent.value,
        kind: pasteKind.value,
        slug: pasteSlug.value || undefined,
        overwrite: pasteOverwrite.value,
      },
    });
    message.value = `${result.note} → ${result.kind}/${result.slug}`;
    previewPath.value = result.previewPath || "";
  } catch (err) {
    errorMessage.value = explainError(err);
  } finally {
    busy.value = false;
  }
}

async function runUploadImport() {
  const file = uploadInput.value?.files?.[0];
  if (!file) {
    errorMessage.value = "Choose a markdown file first.";
    return;
  }

  busy.value = true;
  resetStatus();
  try {
    const form = new FormData();
    form.append("file", file);
    if (uploadKind.value) form.append("kind", uploadKind.value);
    if (uploadSlug.value.trim()) form.append("slug", uploadSlug.value.trim());
    if (uploadOverwrite.value) form.append("overwrite", "1");

    const result = await $fetch<ImportResult>("/api/admin/import-upload", {
      method: "POST",
      body: form,
    });
    message.value = `${result.note} → ${result.kind}/${result.slug}`;
    previewPath.value = result.previewPath || "";
    if (uploadInput.value) uploadInput.value.value = "";
  } catch (err) {
    errorMessage.value = explainError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div>
    <header class="mb-10">
      <h1 class="text-3xl font-semibold tracking-tight">Tools</h1>
      <p class="font-sans-ui mt-2 max-w-xl text-sm text-[var(--muted)]">
        Import catalog docs into GitHub. Coolify redeploy publishes the
        filesystem copy; use live preview while waiting.
      </p>
    </header>

    <div class="font-sans-ui space-y-8">
      <section class="border border-[var(--line)] p-6">
        <h2 class="text-lg font-semibold tracking-tight">Import from GitHub URL</h2>
        <p class="mt-2 text-sm text-[var(--muted)]">
          Paste a
          <span class="font-mono-ui">blob</span>,
          <span class="font-mono-ui">raw</span>, or skill-folder
          <span class="font-mono-ui">tree</span>
          URL. Only github.com hosts.
        </p>
        <form class="mt-5 space-y-4" @submit.prevent="runGithubImport">
          <label class="flex flex-col gap-1.5">
            <span class="text-xs text-[var(--muted)]">GitHub URL</span>
            <input
              v-model="githubUrl"
              required
              type="url"
              placeholder="https://github.com/org/repo/blob/main/skills/foo/SKILL.md"
              class="rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--ink)]"
            />
          </label>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="flex flex-col gap-1.5">
              <span class="text-xs text-[var(--muted)]">Kind (optional)</span>
              <select
                v-model="githubKind"
                class="rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--ink)]"
              >
                <option value="">Infer from filename</option>
                <option value="skills">skills</option>
                <option value="mcps">mcps</option>
                <option value="rules">rules</option>
              </select>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-xs text-[var(--muted)]">Slug override (optional)</span>
              <input
                v-model="githubSlug"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="my-skill"
                class="rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--ink)]"
              />
            </label>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="githubOverwrite" type="checkbox" class="size-4" />
            Overwrite if slug already exists
          </label>
          <button
            type="submit"
            class="rounded-md bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-[var(--paper)] disabled:opacity-50"
            :disabled="busy"
          >
            {{ busy ? "Working…" : "Import from GitHub" }}
          </button>
        </form>
      </section>

      <section class="border border-[var(--line)] p-6">
        <h2 class="text-lg font-semibold tracking-tight">Paste markdown / script</h2>
        <p class="mt-2 text-sm text-[var(--muted)]">
          Paste a full
          <span class="font-mono-ui">SKILL.md</span>
          (with frontmatter) or plain markdown. Missing frontmatter is filled in.
        </p>
        <form class="mt-5 space-y-4" @submit.prevent="runPasteImport">
          <label class="flex flex-col gap-1.5">
            <span class="text-xs text-[var(--muted)]">Content</span>
            <textarea
              v-model="pasteContent"
              required
              rows="12"
              class="font-mono-ui rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
              placeholder="---&#10;name: my-skill&#10;description: &quot;…&quot;&#10;---&#10;&#10;# My skill"
            />
          </label>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="flex flex-col gap-1.5">
              <span class="text-xs text-[var(--muted)]">Kind</span>
              <select
                v-model="pasteKind"
                class="rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--ink)]"
              >
                <option value="skills">skills</option>
                <option value="mcps">mcps</option>
                <option value="rules">rules</option>
              </select>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-xs text-[var(--muted)]">Slug (optional)</span>
              <input
                v-model="pasteSlug"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="my-skill"
                class="rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--ink)]"
              />
            </label>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="pasteOverwrite" type="checkbox" class="size-4" />
            Overwrite if slug already exists
          </label>
          <button
            type="submit"
            class="rounded-md bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-[var(--paper)] disabled:opacity-50"
            :disabled="busy"
          >
            {{ busy ? "Working…" : "Import paste" }}
          </button>
        </form>
      </section>

      <section class="border border-[var(--line)] p-6">
        <h2 class="text-lg font-semibold tracking-tight">Upload markdown file</h2>
        <p class="mt-2 text-sm text-[var(--muted)]">
          Upload
          <span class="font-mono-ui">.md</span>,
          <span class="font-mono-ui">.mdc</span>, or
          <span class="font-mono-ui">.txt</span>
          (max 512KB).
        </p>
        <form class="mt-5 space-y-4" @submit.prevent="runUploadImport">
          <label class="flex flex-col gap-1.5">
            <span class="text-xs text-[var(--muted)]">File</span>
            <input
              ref="uploadInput"
              type="file"
              accept=".md,.mdc,.markdown,.txt,text/markdown,text/plain"
              required
              class="text-sm file:mr-3 file:rounded-md file:border file:border-[var(--line)] file:bg-transparent file:px-3 file:py-2"
            />
          </label>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="flex flex-col gap-1.5">
              <span class="text-xs text-[var(--muted)]">Kind (optional)</span>
              <select
                v-model="uploadKind"
                class="rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--ink)]"
              >
                <option value="">Infer from filename</option>
                <option value="skills">skills</option>
                <option value="mcps">mcps</option>
                <option value="rules">rules</option>
              </select>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-xs text-[var(--muted)]">Slug override (optional)</span>
              <input
                v-model="uploadSlug"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="my-skill"
                class="rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--ink)]"
              />
            </label>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="uploadOverwrite" type="checkbox" class="size-4" />
            Overwrite if slug already exists
          </label>
          <button
            type="submit"
            class="rounded-md bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-[var(--paper)] disabled:opacity-50"
            :disabled="busy"
          >
            {{ busy ? "Working…" : "Upload and import" }}
          </button>
        </form>
      </section>

      <section class="border border-[var(--line)] p-6">
        <h2 class="text-lg font-semibold tracking-tight">Bulk re-import skills</h2>
        <p class="mt-2 text-sm text-[var(--muted)]">
          Copy from
          <span class="font-mono-ui">~/.agents/skills</span>
          (or
          <span class="font-mono-ui">SKILLS_SOURCE</span>
          ) and commit each
          <span class="font-mono-ui">SKILL.md</span>.
          Coolify may return 503 without a mounted source.
        </p>
        <button
          type="button"
          class="mt-5 rounded-md border border-[var(--line)] px-4 py-2.5 text-sm disabled:opacity-50"
          :disabled="busy"
          @click="runBulkImport"
        >
          {{ busy ? "Working…" : "Re-import skills" }}
        </button>
      </section>

      <div
        v-if="errorMessage || message"
        class="border border-[var(--line)] px-5 py-4"
      >
        <p v-if="errorMessage" class="text-sm" role="alert">{{ errorMessage }}</p>
        <p
          v-if="message"
          class="text-sm text-[var(--muted)]"
          role="status"
        >
          {{ message }}
          <NuxtLink
            v-if="previewPath"
            :to="previewPath"
            class="ml-2 underline hover:text-[var(--ink)]"
          >
            Open live preview
          </NuxtLink>
        </p>
        <ul
          v-if="committed.length"
          class="font-mono-ui mt-3 max-h-64 overflow-y-auto text-xs text-[var(--muted)]"
        >
          <li v-for="entry in committed" :key="entry">{{ entry }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>
