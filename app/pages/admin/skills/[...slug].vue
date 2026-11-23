<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });

const route = useRoute();
const slugParam = route.params.slug;
const slug = Array.isArray(slugParam)
  ? slugParam.join("/")
  : String(slugParam || "");

useCatalogSeo({
  title: `Edit ${slug}`,
  description: "Edit a skill.",
  robots: "noindex, nofollow",
});
</script>

<template>
  <AdminCatalogEditor kind="skills" mode="edit" :slug="slug" />
</template>
