<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "admin",
});

useCatalogSeo({
  title: "Admin",
  description: "Add or update skills, MCPs, and rules.",
  robots: "noindex, nofollow",
});

type CatalogKind = "skills" | "mcps" | "rules";

interface CatalogMeta {
  slug: string;
  name: string;
  description: string;
  whenToUse?: string | null;
  tags?: string[];
  draft?: boolean;
  private?: boolean;
  source?: string | null;
  transport?: string | null;
  alwaysApply?: boolean | null;
}

const { data: me } = await useFetch<{ login: string }>("/api/admin/me");

const kind = ref<CatalogKind>("skills");
const mode = ref<"create" | "edit">("create");
const name = ref("");
const description = ref("");
const whenToUse = ref("");
const tags = ref("");
const body = ref("# New entry\n\nWrite instructions here.\n");
const draft = ref(false);
const isPrivate = ref(false);
const source = ref("");
const transport = ref("");
const alwaysApply = ref(false);
const editSlug = ref("");
const submitting = ref(false);
const importing = ref(false);
const message = ref("");
const errorMessage = ref("");
const previewPath = ref("");

const listUrl = computed(() => `/api/${kind.value}?all=1`);
const { data: catalog, refresh } = await useFetch<{
  items?: CatalogMeta[];
  skills?: CatalogMeta[];
}>(listUrl, { watch: [kind] });

const entries = computed(
  () => catalog.value?.items || catalog.value?.skills || [],
);

function kindLabel(value: CatalogKind) {
  switch (value) {
    case "skills":
      return "skill";
    case "mcps":
      return "MCP";
    case "rules":
      return "rule";
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
}

function resetCreate() {
  mode.value = "create";
  name.value = "";
  description.value = "";
  whenToUse.value = "";
  tags.value = "";
  body.value = `# New ${kindLabel(kind.value)}\n\nWrite instructions here.\n`;
  draft.value = false;
  isPrivate.value = false;
  source.value = "";
  transport.value = "";
  alwaysApply.value = false;
  editSlug.value = "";
  message.value = "";
  errorMessage.value = "";
  previewPath.value = "";
}

watch(kind, () => {
  resetCreate();
});

async function loadForEdit(slug: string) {
  errorMessage.value = "";
  message.value = "";
  previewPath.value = "";
  try {
    const item = await $fetch<{
      slug: string;
      name: string;
      description: string;
      whenToUse?: string | null;
      tags?: string[];
      body: string;
      draft?: boolean;
      private?: boolean;
      source?: string | null;
      transport?: string | null;
      alwaysApply?: boolean | null;
    }>(`/api/${kind.value}/${slug}`);
    mode.value = "edit";
    editSlug.value = item.slug;
    name.value = item.name;
    description.value = item.description;
    whenToUse.value = item.whenToUse || "";
    tags.value = (item.tags || []).join(", ");
    body.value = item.body;
    draft.value = Boolean(item.draft);
    isPrivate.value = Boolean(item.private);
    source.value = item.source || "";
    transport.value = item.transport || "";
    alwaysApply.value = Boolean(item.alwaysApply);
  } catch {
    errorMessage.value = `Could not load that ${kindLabel(kind.value)}.`;
  }
}

function payloadBody() {
  return {
    description: description.value,
    whenToUse: whenToUse.value,
    tags: tags.value,
    body: body.value,
    draft: draft.value,
    private: isPrivate.value,
    source: source.value || undefined,
    transport: transport.value || undefined,
    alwaysApply: kind.value === "rules" ? alwaysApply.value : undefined,
  };
}

async function submit() {
  submitting.value = true;
  errorMessage.value = "";
  message.value = "";
  previewPath.value = "";
  try {
    if (mode.value === "create") {
      const result = await $fetch<{
        note: string;
        slug: string;
        previewPath?: string;
      }>(`/api/admin/catalog/${kind.value}`, {
        method: "POST",
        body: {
          name: name.value,
          ...payloadBody(),
        },
      });
      message.value = result.note;
      previewPath.value = result.previewPath || "";
      await refresh();
      resetCreate();
      message.value = result.note;
      previewPath.value = result.previewPath || "";
    } else {
      const result = await $fetch<{ note: string; previewPath?: string }>(
        `/api/admin/catalog/${kind.value}/${editSlug.value}`,
        {
          method: "PUT",
          body: payloadBody(),
        },
      );
      message.value = result.note;
      previewPath.value = result.previewPath || "";
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

async function runImport() {
  importing.value = true;
  errorMessage.value = "";
  message.value = "";
  try {
    const result = await $fetch<{ note: string; count: number }>(
      "/api/admin/import-skills",
      { method: "POST" },
    );
    message.value = `${result.note} (${result.count} skills)`;
    if (kind.value === "skills") await refresh();
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
      <p class="font-sans-ui text-sm text-[var(--muted)]">
        Signed in as {{ me?.login }}
      </p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight">
        {{
          mode === "create"
            ? `Add a ${kindLabel(kind)}`
            : `Edit ${editSlug}`
        }}
      </h1>
      <p class="font-sans-ui mt-2 text-sm text-[var(--muted)]">
        Commits to GitHub. Open live preview while Coolify redeploys.
      </p>
    </header>

    <div class="font-sans-ui mb-8 flex flex-wrap gap-2 text-sm">
      <button
        v-for="option in (['skills', 'mcps', 'rules'] as CatalogKind[])"
        :key="option"
        type="button"
        class="px-3 py-1.5 transition-colors"
        :class="
          kind === option
            ? 'bg-[var(--ink)] text-[var(--paper)]'
            : 'text-[var(--muted)] hover:text-[var(--ink)]'
        "
        @click="kind = option"
      >
        {{ option }}
      </button>
    </div>

    <form class="font-sans-ui space-y-5" @submit.prevent="submit">
      <label v-if="mode === 'create'" class="flex flex-col gap-1.5">
        <span class="text-xs text-[var(--muted)]">Name (folder slug)</span>
        <input
          v-model="name"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          maxlength="64"
          placeholder="my-entry"
          class="rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--ink)]"
        />
      </label>

      <label class="flex flex-col gap-1.5">
        <span class="text-xs text-[var(--muted)]">When to use</span>
        <input
          v-model="whenToUse"
          maxlength="280"
          placeholder="Short blurb for list cards"
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
        <span class="text-xs text-[var(--muted)]">Tags (comma-separated)</span>
        <input
          v-model="tags"
          placeholder="design, testing, git"
          class="rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--ink)]"
        />
      </label>

      <div
        v-if="kind === 'mcps'"
        class="grid gap-4 sm:grid-cols-2"
      >
        <label class="flex flex-col gap-1.5">
          <span class="text-xs text-[var(--muted)]">Source</span>
          <input
            v-model="source"
            class="rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--ink)]"
          />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-xs text-[var(--muted)]">Transport</span>
          <input
            v-model="transport"
            class="rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--ink)]"
          />
        </label>
      </div>

      <label
        v-if="kind === 'rules'"
        class="flex items-center gap-2 text-sm"
      >
        <input v-model="alwaysApply" type="checkbox" class="size-4" />
        Always apply
      </label>

      <div class="flex flex-wrap gap-5 text-sm">
        <label class="flex items-center gap-2">
          <input v-model="draft" type="checkbox" class="size-4" />
          Draft (hidden from public)
        </label>
        <label class="flex items-center gap-2">
          <input v-model="isPrivate" type="checkbox" class="size-4" />
          Private
        </label>
      </div>

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
        <NuxtLink
          v-if="previewPath"
          :to="previewPath"
          class="ml-2 underline hover:text-[var(--ink)]"
        >
          Open live preview
        </NuxtLink>
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
                ? `Commit ${kindLabel(kind)}`
                : "Commit update"
          }}
        </button>
        <button
          v-if="mode === 'edit'"
          type="button"
          class="rounded-md border border-[var(--line)] px-4 py-2.5 text-sm"
          @click="resetCreate"
        >
          New {{ kindLabel(kind) }}
        </button>
      </div>
    </form>

    <section
      v-if="kind === 'skills'"
      class="mt-10 border-t border-[var(--line)] pt-8"
    >
      <h2 class="text-lg font-semibold tracking-tight">Bulk re-import</h2>
      <p class="font-sans-ui mt-2 text-sm text-[var(--muted)]">
        Copy from
        <span class="font-mono-ui">~/.agents/skills</span>
        (or
        <span class="font-mono-ui">SKILLS_SOURCE</span>
        ) and commit each
        <span class="font-mono-ui">SKILL.md</span>
        to GitHub.
      </p>
      <button
        type="button"
        class="mt-4 rounded-md border border-[var(--line)] px-4 py-2.5 text-sm disabled:opacity-50"
        :disabled="importing"
        @click="runImport"
      >
        {{ importing ? "Importing…" : "Re-import skills" }}
      </button>
    </section>

    <section class="mt-14 border-t border-[var(--line)] pt-8">
      <h2 class="text-xl font-semibold tracking-tight">
        Existing {{ kind }}
      </h2>
      <ul class="mt-4 divide-y divide-[var(--line)]">
        <li
          v-for="item in entries"
          :key="item.slug"
          class="flex items-center justify-between gap-4 py-3"
        >
          <div class="min-w-0">
            <p class="truncate font-medium">
              {{ item.name }}
              <span
                v-if="item.draft || item.private"
                class="font-sans-ui ml-2 text-xs font-normal text-[var(--muted)]"
              >
                {{
                  [item.draft ? "draft" : null, item.private ? "private" : null]
                    .filter(Boolean)
                    .join(" · ")
                }}
              </span>
            </p>
            <p class="font-mono-ui truncate text-xs text-[var(--muted)]">
              {{ item.slug }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-3">
            <NuxtLink
              :to="`/${kind}/${item.slug}?source=github`"
              class="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
            >
              Preview
            </NuxtLink>
            <button
              type="button"
              class="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
              @click="loadForEdit(item.slug)"
            >
              Edit
            </button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
