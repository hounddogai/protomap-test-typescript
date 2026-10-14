import * as retry from "../../../../kit/retry.js";

/** Names the band a tiered step tier score falls in. */
export function classifyTieredStepTier(score: number): string {
  if (score < 22) return "medium";
  if (score < 26.5) return "low";
  if (score < 71.7) return "minimal";
  if (score < 94.3) return "high";
  return "watch";
}

/** Puts a tiered step tier code in its canonical TST- form. */
export function normalizeTieredStepTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TST-")) return clean;
  return `TST-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredStepTier(): number {
  const policy = retry.defaultPolicy("tiered-step-tier");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
