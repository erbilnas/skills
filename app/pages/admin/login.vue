<script setup lang="ts">
definePageMeta({
  layout: false,
});

useSeoMeta({
  robots: "noindex, nofollow",
  title: "Admin login",
});

const route = useRoute();

const { data: status } = await useFetch<{
  configured: boolean;
  writeConfigured: boolean;
  missing: string[];
}>("/api/admin/auth/status");

try {
  const meHeaders = import.meta.server
    ? useRequestHeaders(["cookie"])
    : undefined;
  await $fetch("/api/admin/me", { headers: meHeaders });
  await navigateTo("/admin");
} catch {
  // stay on login
}

const missing = computed(() => status.value?.missing ?? []);
const configured = computed(() => Boolean(status.value?.configured));

const errorKey = computed(() => {
  const raw = route.query.error;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "forbidden" || value === "oauth" || value === "state") {
    return value;
  }
  return "";
});

const errorCopy: Record<string, string> = {
  forbidden: "That GitHub account is not allowlisted.",
  oauth: "GitHub OAuth failed. Try again.",
  state: "Login state expired. Try again.",
};
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center px-6">
    <div class="flex max-w-sm flex-col items-center gap-6 text-center">
      <h1 class="text-2xl font-semibold tracking-tight">Admin</h1>
      <p class="font-sans-ui text-sm text-[var(--muted)]">
        Sign in with the allowlisted GitHub account to add skills.
      </p>
      <p
        v-if="errorKey"
        class="font-sans-ui text-sm text-[var(--ink)]"
        role="alert"
      >
        {{ errorCopy[errorKey] }}
      </p>
      <div
        v-if="missing.length"
        class="font-sans-ui w-full text-left text-sm text-[var(--muted)]"
        role="status"
      >
        <p>Missing configuration:</p>
        <ul class="font-mono-ui mt-2 list-disc pl-5 text-xs">
          <li v-for="key in missing" :key="key">{{ key }}</li>
        </ul>
      </div>
      <a
        v-if="configured"
        href="/api/admin/auth/github"
        class="font-sans-ui rounded-md bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-[var(--paper)]"
      >
        Continue with GitHub
      </a>
      <NuxtLink
        to="/"
        class="font-sans-ui text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        Back to catalog
      </NuxtLink>
    </div>
  </div>
</template>
