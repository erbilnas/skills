// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxtjs/tailwindcss", "@nuxtjs/color-mode"],
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  css: ["~/assets/css/main.css"],

  colorMode: {
    classSuffix: "",
    preference: "system",
    fallback: "light",
  },

  app: {
    head: {
      title: "Skills by Erbil Nas",
      titleTemplate: "%s",
      htmlAttrs: { lang: "en" },
      meta: [
        {
          name: "description",
          content:
            "Agent skills, MCPs, and Cursor rules by Erbil Nas. Browse the catalog and install what you need.",
        },
        { name: "theme-color", content: "#f7f5f2" },
        { name: "color-scheme", content: "light dark" },
      ],
      link: [
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        {
          rel: "alternate",
          type: "application/rss+xml",
          title: "Skills catalog RSS",
          href: "/api/feed.xml",
        },
        {
          rel: "alternate",
          type: "application/json",
          title: "Skills catalog JSON",
          href: "/api/feed.json",
        },
        { rel: "sitemap", type: "application/xml", href: "/api/sitemap.xml" },
      ],
    },
  },

  runtimeConfig: {
    admin: {
      githubClientId: process.env.GITHUB_OAUTH_CLIENT_ID || "",
      githubClientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET || "",
      sessionSecret: process.env.ADMIN_SESSION_SECRET || "",
      allowedLogin: process.env.ADMIN_GITHUB_LOGIN || "",
    },
    github: {
      username: process.env.GITHUB_USERNAME || "",
      token: process.env.GITHUB_TOKEN || "",
      repo: process.env.GITHUB_REPO || "",
      branch: process.env.GITHUB_BRANCH || "main",
    },
    public: {
      siteUrl: process.env.NUXT_APP_URL || "https://skills.erbilnas.com",
      githubRepo: process.env.GITHUB_REPO || "",
    },
  },
});
