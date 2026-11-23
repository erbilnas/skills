<script setup lang="ts">
const colorMode = useColorMode();

function toggleTheme() {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}
</script>

<template>
  <div class="min-h-dvh">
    <header
      class="font-sans-ui border-b border-[var(--line)] px-5 py-4 sm:px-8"
    >
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <NuxtLink to="/" class="group flex items-baseline gap-3">
          <span class="text-lg font-semibold tracking-tight">Skills</span>
          <span class="text-sm text-[var(--muted)]">erbilnas.com</span>
        </NuxtLink>
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
      <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p>Agent skills for Cursor, Claude, and friends.</p>
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
