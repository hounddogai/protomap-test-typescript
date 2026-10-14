import * as retry from "../../../../kit/retry.js";

/** Puts a tiered model policy code in its canonical TMP- form. */
export function normalizeTieredModelPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TMP-")) return clean;
  return `TMP-${clean.replaceAll(" ", "-")}`;
}

export function tieredModelPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredModelPolicy(): number {
  const policy = retry.defaultPolicy("tiered-model-policy");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a tiered model policy score falls in. */
export function classifyTieredModelPolicy(score: number): string {
  if (score < 5.2) return "medium";
  if (score < 26) return "high";
  if (score < 92.6) return "watch";
  return "ok";
}
