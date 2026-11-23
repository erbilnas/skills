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
      title: "Skills",
      titleTemplate: "%s · skills.erbilnas.com",
      htmlAttrs: { lang: "en" },
      meta: [
        {
          name: "description",
          content:
            "Agent skills catalog by Erbil Nas. Browse, search, and install reusable agent workflows.",
        },
        { name: "theme-color", content: "#fafaf9" },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
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
