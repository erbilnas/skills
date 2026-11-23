export function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

const SECRET_KEY =
  /(key|token|secret|password|authorization|auth|client_secret|api[_-]?key)/i;

export function scrubSecrets(value) {
  if (Array.isArray(value)) {
    return value.map(scrubSecrets);
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      if (SECRET_KEY.test(key) && typeof nested === "string" && nested) {
        out[key] = "***";
      } else {
        out[key] = scrubSecrets(nested);
      }
    }
    return out;
  }
  return value;
}

export function transportOf(config) {
  if (!config || typeof config !== "object") return "unknown";
  if (config.command) return "stdio";
  if (config.type === "sse" || config.type === "http") return config.type;
  if (config.url) return "http";
  return "unknown";
}
