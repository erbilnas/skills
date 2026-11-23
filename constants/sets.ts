export interface SkillSetDef {
  slug: string;
  name: string;
  description: string;
  skills: readonly string[];
}

/** Curated skill packs. Order is intentional. */
export const SKILL_SETS: readonly SkillSetDef[] = [
  {
    slug: "starter",
    name: "Starter",
    description: "Ten skills worth installing first.",
    skills: [
      "simple",
      "find-skills",
      "systematic-debugging",
      "tdd",
      "code-review",
      "baseline-ui",
      "no-ai-slop",
      "spec",
      "git-commit",
      "caveman",
    ],
  },
  {
    slug: "design",
    name: "Design",
    description: "UI craft, anti-slop, and interface polish.",
    skills: [
      "baseline-ui",
      "no-ai-slop",
      "unslop-ui",
      "impeccable",
      "design-taste-frontend",
      "minimalist-ui",
      "make-interfaces-feel-better",
      "web-design-guidelines",
      "fixing-accessibility",
      "beautiful-shadows",
    ],
  },
  {
    slug: "shipping",
    name: "Shipping",
    description: "Spec, build, review, and land the change.",
    skills: [
      "spec",
      "implement",
      "tdd",
      "code-review",
      "git-commit",
      "pr",
      "review",
      "setup-pre-commit",
      "github-actions-docs",
      "retro",
    ],
  },
  {
    slug: "debugging",
    name: "Debugging",
    description: "When something is broken and you need a clear path.",
    skills: [
      "systematic-debugging",
      "diagnosing-bugs",
      "triage",
      "sentry-cli",
      "check",
      "wait-what",
      "backprop",
    ],
  },
  {
    slug: "writing",
    name: "Writing",
    description: "Docs, copy, and agent-readable prose.",
    skills: [
      "copywriting",
      "humanizer",
      "documentation-writer",
      "writing-for-agents",
      "writing-skills",
      "writing-shape",
      "writing-beats",
      "writing-fragments",
    ],
  },
  {
    slug: "frontend",
    name: "Frontend",
    description: "Vue, Nuxt, React, and component systems.",
    skills: [
      "vue",
      "nuxt",
      "shadcn",
      "daisyui",
      "next-best-practices",
      "vercel-react-best-practices",
      "react-doctor",
      "pick-ui-library",
      "modern-web-guidance",
    ],
  },
  {
    slug: "agents",
    name: "Agents",
    description: "Skills, prompts, and how to work with the agent.",
    skills: [
      "find-skills",
      "writing-skills",
      "writing-for-agents",
      "caveman",
      "cavecrew",
      "mcp-builder",
      "grill",
      "handoff",
      "simple",
    ],
  },
] as const;

export function getSkillSet(slug: string): SkillSetDef | undefined {
  return SKILL_SETS.find((set) => set.slug === slug);
}
