<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();

const message = computed(() => {
  const status = props.error?.statusMessage || props.error?.message || "";
  if (status) return status;
  if (props.error?.statusCode === 404) {
    return "Not found. If you just committed, try ?source=github or wait for Coolify.";
  }
  return "Something went wrong.";
});

useCatalogSeo({
  title: props.error?.statusCode === 404 ? "Not found" : "Error",
  description: message.value,
  robots: "noindex",
});

function goHome() {
  clearError({ redirect: "/" });
}
</script>

<template>
  <div class="min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
    <main class="mx-auto flex max-w-2xl flex-col px-5 py-24 sm:px-8">
      <p class="font-sans-ui text-sm text-[var(--muted)]">
        {{ error?.statusCode || 500 }}
      </p>
      <h1 class="mt-3 text-3xl font-semibold tracking-tight">
        {{ error?.statusCode === 404 ? "Not on this deploy" : "Error" }}
      </h1>
      <p class="mt-4 text-pretty text-[var(--muted)]">
        {{ message }}
      </p>
      <div class="font-sans-ui mt-8 flex flex-wrap gap-4 text-sm">
        <button
          type="button"
          class="rounded-md bg-[var(--ink)] px-4 py-2.5 font-medium text-[var(--paper)]"
          @click="goHome"
        >
          Back to catalog
        </button>
        <NuxtLink to="/admin" class="py-2.5 text-[var(--muted)] hover:text-[var(--ink)]">
          Admin
        </NuxtLink>
      </div>
    </main>
  </div>
</template>
