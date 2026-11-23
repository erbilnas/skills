<script setup lang="ts">
async function logout() {
  await $fetch("/api/admin/auth/logout", { method: "POST" });
  await navigateTo("/admin/login");
}
</script>

<template>
  <div class="min-h-dvh">
    <header
      class="font-sans-ui border-b border-[var(--line)] px-5 py-4 sm:px-8"
    >
      <div class="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="text-[var(--muted)] hover:text-[var(--ink)]">
            Catalog
          </NuxtLink>
          <NuxtLink to="/admin" class="font-semibold tracking-tight">
            Admin
          </NuxtLink>
        </div>
        <button
          type="button"
          class="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
          @click="logout"
        >
          Log out
        </button>
      </div>
    </header>
    <main class="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <slot />
    </main>
  </div>
</template>
