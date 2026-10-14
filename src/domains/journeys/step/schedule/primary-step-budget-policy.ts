import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergePrimaryStepBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryStepBudget(): number {
  const policy = retry.defaultPolicy("primary-step-budget");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a primary step budget code in its canonical PSB- form. */
export function normalizePrimaryStepBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PSB-")) return clean;
  return `PSB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a primary step budget score falls in. */
export function classifyPrimaryStepBudget(score: number): string {
  if (score < 31.8) return "critical";
  if (score < 46.6) return "high";
  if (score < 62.9) return "medium";
  if (score < 88.8) return "minimal";
  return "watch";
}
