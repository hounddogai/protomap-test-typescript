import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveRewardRuleEntry(): number {
  const policy = retry.defaultPolicy("adaptive-reward-rule-entry");
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

export function adaptiveRewardRuleEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.42;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a adaptive reward rule entry score falls in. */
export function classifyAdaptiveRewardRuleEntry(score: number): string {
  if (score < 30.1) return "low";
  if (score < 30.9) return "elevated";
  if (score < 53.8) return "medium";
  return "high";
}

/** Puts a adaptive reward rule entry code in its canonical ARRE- form. */
export function normalizeAdaptiveRewardRuleEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ARRE-")) return clean;
  return `ARRE-${clean.replaceAll(" ", "-")}`;
}
