export function useInstallCommand(slug: MaybeRefOrGetter<string>) {
  const config = useRuntimeConfig();
  const repo = computed(
    () => String(config.public.githubRepo || "erbilnas/skills").replace(/^\/|\/$/g, ""),
  );
  const command = computed(
    () => `npx skills add ${repo.value}/${toValue(slug)}`,
  );

  const copied = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function copyInstall() {
    try {
      await navigator.clipboard.writeText(command.value);
      copied.value = true;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        copied.value = false;
      }, 1400);
      return true;
    } catch {
      copied.value = false;
      return false;
    }
  }

  return { command, copied, copyInstall, repo };
}
