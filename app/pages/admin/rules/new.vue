<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useCatalogSeo({
  title: "New rule",
  description: "Create a rule.",
  robots: "noindex, nofollow",
});
</script>

<template>
  <AdminCatalogEditor kind="rules" mode="create" />
</template>
