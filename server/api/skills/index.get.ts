export default defineEventHandler(async () => {
  const skills = await listSkills();
  const categories = [
    ...new Set(
      skills
        .map((skill) => skill.category)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  return {
    count: skills.length,
    categories,
    skills,
  };
});
