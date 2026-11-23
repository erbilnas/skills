<script setup lang="ts">
import type { AdminCatalogKind } from "~/composables/useAdminCatalog";
import { kindLabel } from "~/composables/useAdminCatalog";

const props = defineProps<{
  kind: AdminCatalogKind;
  mode: "create" | "edit";
  slug?: string;
}>();

const name = ref("");
const description = ref("");
const whenToUse = ref("");
const tags = ref("");
const body = ref(`# New ${kindLabel(props.kind)}\n\nWrite instructions here.\n`);
const draft = ref(false);
const isPrivate = ref(false);
const source = ref("");
const transport = ref("");
const alwaysApply = ref(false);

const submitting = ref(false);
const loading = ref(false);
const message = ref("");
const errorMessage = ref("");
const previewPath = ref("");
const previewHtml = ref("");
const dirty = ref(false);

const cancelTo = computed(() => `/admin/${props.kind}`);

onMounted(async () => {
  if (props.mode === "edit" && props.slug) {
    loading.value = true;
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
      }>(`/api/${props.kind}/${props.slug}`);
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
      dirty.value = false;
      await refreshPreview();
    } catch {
      errorMessage.value = `Could not load that ${kindLabel(props.kind)}.`;
    } finally {
      loading.value = false;
    }
  } else {
    await refreshPreview();
  }
});

watch(
  [name, description, whenToUse, tags, body, draft, isPrivate, source, transport, alwaysApply],
  () => {
    dirty.value = true;
  },
);

let previewTimer: ReturnType<typeof setTimeout> | null = null;
watch(body, () => {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    void refreshPreview();
  }, 350);
});

async function refreshPreview() {
  try {
    const result = await $fetch<{ html: string }>("/api/admin/preview", {
      method: "POST",
      body: { markdown: body.value },
    });
    previewHtml.value = result.html;
  } catch {
    previewHtml.value = "";
  }
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value || submitting.value) return;
  event.preventDefault();
  event.returnValue = "";
}

onMounted(() => {
  window.addEventListener("beforeunload", onBeforeUnload);
});
onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
});

onBeforeRouteLeave((_to, _from, next) => {
  if (!dirty.value || submitting.value) {
    next();
    return;
  }
  const ok = window.confirm("You have unsaved changes. Leave anyway?");
  next(ok);
});

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
    alwaysApply: props.kind === "rules" ? alwaysApply.value : undefined,
  };
}

async function submit() {
  submitting.value = true;
  errorMessage.value = "";
  message.value = "";
  previewPath.value = "";
  try {
    if (props.mode === "create") {
      const result = await $fetch<{
        note: string;
        slug: string;
        previewPath?: string;
      }>(`/api/admin/catalog/${props.kind}`, {
        method: "POST",
        body: {
          name: name.value,
          ...payloadBody(),
        },
      });
      dirty.value = false;
      message.value = result.note;
      previewPath.value = result.previewPath || "";
      await navigateTo(`/admin/${props.kind}/${result.slug}`);
    } else {
      const result = await $fetch<{ note: string; previewPath?: string }>(
        `/api/admin/catalog/${props.kind}/${props.slug}`,
        {
          method: "PUT",
          body: payloadBody(),
        },
      );
      dirty.value = false;
      message.value = result.note;
      previewPath.value = result.previewPath || "";
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
    <div
      class="font-sans-ui sticky top-[57px] z-10 -mx-5 mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-5 py-3 sm:-mx-8 sm:px-8"
    >
      <div class="min-w-0">
        <p class="text-xs text-[var(--muted)]">
          {{ mode === "create" ? "New" : "Edit" }}
          {{ kindLabel(kind) }}
          <span v-if="dirty" class="ml-2">· unsaved</span>
        </p>
        <h1 class="truncate text-xl font-semibold tracking-tight">
          {{ mode === "create" ? name || "Untitled" : slug }}
        </h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <NuxtLink
          :to="cancelTo"
          class="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
        >
          Cancel
        </NuxtLink>
        <NuxtLink
          v-if="mode === 'edit' && slug"
          :to="`/${kind}/${slug}?source=github`"
          class="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
          target="_blank"
        >
          Preview
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
      class="font-sans-ui space-y-8"
      @submit.prevent="submit"
    >
      <section class="space-y-4">
        <h2 class="text-sm font-semibold tracking-tight">Identity</h2>
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
      </section>

      <section class="space-y-4">
        <h2 class="text-sm font-semibold tracking-tight">Visibility</h2>
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
      </section>

      <section v-if="kind === 'mcps'" class="space-y-4">
        <h2 class="text-sm font-semibold tracking-tight">MCP</h2>
        <div class="grid gap-4 sm:grid-cols-2">
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
      </section>

      <section v-if="kind === 'rules'" class="space-y-4">
        <h2 class="text-sm font-semibold tracking-tight">Rule</h2>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="alwaysApply" type="checkbox" class="size-4" />
          Always apply
        </label>
      </section>

      <section class="space-y-4">
        <h2 class="text-sm font-semibold tracking-tight">Body</h2>
        <div class="grid gap-4 lg:grid-cols-2">
          <label class="flex min-h-[24rem] flex-col gap-1.5">
            <span class="text-xs text-[var(--muted)]">Markdown</span>
            <textarea
              v-model="body"
              required
              class="font-mono-ui min-h-[24rem] flex-1 rounded-md border border-[var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
            />
          </label>
          <div class="flex min-h-[24rem] flex-col gap-1.5">
            <span class="text-xs text-[var(--muted)]">Preview</span>
            <div
              class="skill-prose min-h-[24rem] flex-1 overflow-auto rounded-md border border-[var(--line)] px-4 py-3 text-sm"
              v-html="previewHtml"
            />
          </div>
        </div>
      </section>

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
    </form>
  </div>
</template>
