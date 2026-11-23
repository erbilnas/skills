<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useCatalogSeo({
  title: "Admin MCPs",
  description: "Manage MCPs.",
  robots: "noindex, nofollow",
});

const { entries, tags, pending, error, refresh } = useAdminCatalogList("mcps");
</script>

<template>
  <AdminCatalogList
    kind="mcps"
    :entries="entries"
    :tags="tags"
    :pending="pending"
    :error="Boolean(error)"
    @deleted="refresh()"
    @refreshed="refresh()"
  />
</template>
