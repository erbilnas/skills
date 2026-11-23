<script setup lang="ts">
const route = useRoute();
const colorMode = useColorMode();

const links = [
  { to: "/", label: "Skills", match: (path: string) => path === "/" || path.startsWith("/skills") },
  { to: "/mcps", label: "MCPs", match: (path: string) => path.startsWith("/mcps") },
  { to: "/rules", label: "Rules", match: (path: string) => path.startsWith("/rules") },
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
      class="font-sans-ui border-b border-[var(--line)] px-5 py-4 sm:px-8"
    >
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div class="flex min-w-0 items-center gap-6">
          <NuxtLink to="/" class="group flex items-baseline gap-3">
            <span class="text-lg font-semibold tracking-tight">Skills</span>
            <span class="hidden text-sm text-[var(--muted)] sm:inline">
              erbilnas.com
            </span>
          </NuxtLink>
          <nav class="flex items-center gap-4 text-sm">
            <NuxtLink
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              class="hover:text-[var(--ink)]"
              :class="
                isActive(link.match)
                  ? 'text-[var(--ink)]'
                  : 'text-[var(--muted)]'
              "
            >
              {{ link.label }}
            </NuxtLink>
          </nav>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <button
            type="button"
            class="text-[var(--muted)] hover:text-[var(--ink)]"
            :aria-label="
              colorMode.value === 'dark'
                ? 'Switch to light theme'
                : 'Switch to dark theme'
            "
            @click="toggleTheme"
          >
            {{ colorMode.value === "dark" ? "Light" : "Dark" }}
          </button>
          <NuxtLink
            to="/admin"
            class="text-[var(--muted)] hover:text-[var(--ink)]"
          >
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
