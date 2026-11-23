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
    to: "/sets",
    label: "Sets",
    match: (path: string) => path.startsWith("/sets"),
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
        class="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:px-8 sm:py-5"
      >
        <div class="justify-self-start flex items-baseline gap-2">
          <NuxtLink
            to="/"
            class="text-2xl font-semibold tracking-tight"
            aria-label="Skills home"
          >
            Skills
          </NuxtLink>
          <span class="font-sans-ui text-xs text-[var(--muted)]">
            by Erbil Nas
          </span>
        </div>

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

        <button
          type="button"
          class="justify-self-end p-1 text-[var(--muted)] hover:text-[var(--ink)]"
          :aria-label="
            colorMode.value === 'dark'
              ? 'Switch to light theme'
              : 'Switch to dark theme'
          "
          @click="toggleTheme"
        >
          <!-- Light mode: show moon (go dark). Dark mode: show sun (go light). -->
          <svg
            v-if="colorMode.value !== 'dark'"
            class="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path
              d="M20.2 14.2A8.2 8.2 0 0 1 9.8 3.8 7 7 0 1 0 20.2 14.2Z"
            />
          </svg>
          <svg
            v-else
            class="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
          </svg>
        </button>
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
        <p>Skills, MCPs, and rules from my setup.</p>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a href="/api/feed.xml" class="hover:text-[var(--ink)]">RSS</a>
          <a href="/api/feed.json" class="hover:text-[var(--ink)]">JSON</a>
          <a
            href="https://erbilnas.com"
            class="hover:text-[var(--ink)]"
            rel="noopener noreferrer"
            target="_blank"
          >
            erbilnas.com
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>
