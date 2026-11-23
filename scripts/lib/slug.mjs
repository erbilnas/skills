export function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** Keys whose values must never be published. */
const SECRET_KEY =
  /(^|_)(key|token|secret|password|passwd|authorization|auth|credential|cookie|session|private|bearer|access|refresh|api[_-]?key|client[_-]?id|client[_-]?secret|app[_-]?id|app[_-]?secret|account[_-]?id|tenant[_-]?id|org[_-]?id|user[_-]?id|project[_-]?id)(_|$)|(^id$)/i;

/** Nested bags that commonly hold credentials. */
const FULL_REDACT_BAGS = new Set(["env", "environment", "secrets", "credentials", "tokens"]);
const PARTIAL_REDACT_BAGS = new Set(["auth", "authentication", "headers", "header"]);

function looksLikeSecretValue(value) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v || v === "***") return false;
  if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v)) {
    return true;
  }
  if (v.length >= 16 && /^[A-Za-z0-9_\-./+=]+$/.test(v) && /[A-Za-z]/.test(v) && /\d/.test(v)) {
    return true;
  }
  if (/^\d{8,}$/.test(v)) {
    return true;
  }
  return false;
}

function shouldRedactString(key, value, mode) {
  if (typeof value !== "string" || !value) return false;
  if (mode === "full") return true;
  if (SECRET_KEY.test(key)) return true;
  if (looksLikeSecretValue(value)) return true;
  return false;
}

function scrubNode(value, parentKey = "", mode = "partial") {
  if (Array.isArray(value)) {
    return value.map((item) => scrubNode(item, parentKey, mode));
  }
  if (value && typeof value === "object") {
    const keyLower = String(parentKey).toLowerCase();
    const nextMode = FULL_REDACT_BAGS.has(keyLower)
      ? "full"
      : PARTIAL_REDACT_BAGS.has(keyLower)
        ? "partial"
        : mode;
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      if (typeof nested === "string") {
        out[key] = shouldRedactString(key, nested, nextMode) ? "***" : nested;
        continue;
      }
      const childMode = FULL_REDACT_BAGS.has(key.toLowerCase())
        ? "full"
        : PARTIAL_REDACT_BAGS.has(key.toLowerCase())
          ? "partial"
          : nextMode;
      out[key] = scrubNode(nested, key, childMode);
    }
    return out;
  }
  if (typeof value === "string" && mode === "full") {
    return "***";
  }
  if (typeof value === "string" && looksLikeSecretValue(value)) {
    return "***";
  }
  return value;
}

/**
 * Deep-redact credentials for a public catalog.
 * Prefer showing shape (command/url/type) without ids, tokens, or secrets.
 */
export function scrubSecrets(value) {
  return scrubNode(value);
}

export function transportOf(config) {
  if (!config || typeof config !== "object") return "unknown";
  if (config.command) return "stdio";
  if (config.type === "sse" || config.type === "http") return config.type;
  if (config.url) return "http";
  return "unknown";
}
