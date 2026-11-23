<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useCatalogSeo({
  title: "New MCP",
  description: "Create an MCP.",
  robots: "noindex, nofollow",
});
</script>

<template>
  <AdminCatalogEditor kind="mcps" mode="create" />
</template>
