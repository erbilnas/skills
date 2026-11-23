<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useCatalogSeo({
  title: "New skill",
  description: "Create a skill.",
  robots: "noindex, nofollow",
});
</script>

<template>
  <AdminCatalogEditor kind="skills" mode="create" />
</template>
