<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useCatalogSeo({
  title: "Admin skills",
  description: "Manage skills.",
  robots: "noindex, nofollow",
});

const { entries, tags, pending, error, refresh } = useAdminCatalogList("skills");
</script>

<template>
  <AdminCatalogList
    kind="skills"
    :entries="entries"
    :tags="tags"
    :pending="pending"
    :error="Boolean(error)"
    @deleted="refresh()"
    @refreshed="refresh()"
  />
</template>
