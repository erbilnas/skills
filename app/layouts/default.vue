<script setup lang="ts">
const route = useRoute();
const colorMode = useColorMode();

const links = [
  {
    to: "/",
    label: "Skills",
    match: (path: string) => path === "/" || path.startsWith("/skills"),
  },
  {
    to: "/mcps",
    label: "MCPs",
    match: (path: string) => path.startsWith("/mcps"),
  },
  {
    to: "/rules",
    label: "Rules",
    match: (path: string) => path.startsWith("/rules"),
  },
];

function toggleTheme() {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}

function isActive(match: (path: string) => boolean) {
  return match(route.path);
}
</script>

<template>
  <div class="min-h-dvh">
    <header
      class="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--paper)]"
    >
      <div
        class="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-end gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:px-8 sm:py-5"
      >
        <NuxtLink
          to="/"
          class="min-w-0 justify-self-start leading-tight"
          aria-label="Skills home"
        >
          <span class="block text-2xl font-semibold tracking-tight">
            Skills
          </span>
          <span class="font-sans-ui mt-0.5 block text-xs text-[var(--muted)]">
            erbilnas.com
          </span>
        </NuxtLink>

        <nav
          class="font-sans-ui col-span-2 flex flex-wrap items-center gap-x-5 gap-y-1 sm:col-span-1 sm:justify-center"
          aria-label="Catalog"
        >
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="py-1 text-sm transition-colors"
            :class="
              isActive(link.match)
                ? 'font-semibold text-[var(--ink)]'
                : 'font-normal text-[var(--muted)] hover:text-[var(--ink)]'
            "
            :aria-current="isActive(link.match) ? 'page' : undefined"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div
          class="font-sans-ui flex items-center justify-self-end gap-4 text-sm text-[var(--muted)]"
        >
          <button
            type="button"
            class="py-1 hover:text-[var(--ink)]"
            :aria-label="
              colorMode.value === 'dark'
                ? 'Switch to light theme'
                : 'Switch to dark theme'
            "
            @click="toggleTheme"
          >
            {{ colorMode.value === "dark" ? "Light" : "Dark" }}
          </button>
          <NuxtLink to="/admin" class="py-1 hover:text-[var(--ink)]">
            Admin
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <slot />
    </main>

    <footer
      class="font-sans-ui border-t border-[var(--line)] px-5 py-8 text-sm text-[var(--muted)] sm:px-8"
    >
      <div
        class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3"
      >
        <p>Skills, MCPs, and rules from my Cursor setup.</p>
        <a
          href="https://erbilnas.com"
          class="hover:text-[var(--ink)]"
          rel="noopener noreferrer"
          target="_blank"
        >
          erbilnas.com
        </a>
      </div>
    </footer>
  </div>
</template>
