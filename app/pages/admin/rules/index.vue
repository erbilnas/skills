<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useCatalogSeo({
  title: "Admin rules",
  description: "Manage rules.",
  robots: "noindex, nofollow",
});

const { entries, tags, pending, error, refresh } = useAdminCatalogList("rules");
</script>

<template>
  <AdminCatalogList
    kind="rules"
    :entries="entries"
    :tags="tags"
    :pending="pending"
    :error="Boolean(error)"
    @deleted="refresh()"
  />
</template>
