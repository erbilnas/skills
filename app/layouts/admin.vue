<script setup lang="ts">
const route = useRoute();

const links = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/skills", label: "Skills" },
  { to: "/admin/mcps", label: "MCPs" },
  { to: "/admin/rules", label: "Rules" },
  { to: "/admin/sets", label: "Sets" },
  { to: "/admin/tools", label: "Tools" },
  { to: "/admin/trash", label: "Trash" },
  { to: "/admin/audit", label: "Audit" },
];

function isActive(to: string, exact?: boolean) {
  if (exact) return route.path === to;
  return route.path === to || route.path.startsWith(`${to}/`);
}

async function logout() {
  await $fetch("/api/admin/auth/logout", { method: "POST" });
  await navigateTo("/admin/login");
}
</script>

<template>
  <div class="min-h-dvh">
    <header
      class="font-sans-ui sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--paper)]"
    >
      <div
        class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-8"
      >
        <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
          <NuxtLink
            to="/"
            class="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Catalog
          </NuxtLink>
          <nav class="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Admin">
            <NuxtLink
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              class="text-sm transition-colors"
              :class="
                isActive(link.to, link.exact)
                  ? 'font-semibold text-[var(--ink)]'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              "
              :aria-current="isActive(link.to, link.exact) ? 'page' : undefined"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>
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
    <main class="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-12">
      <slot />
    </main>
  </div>
</template>
