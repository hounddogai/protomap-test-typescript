import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a global bid rule agreement score falls in. */
export function classifyGlobalBidRuleAgreement(score: number): string {
  if (score < 44.2) return "low";
  if (score < 85.3) return "critical";
  return "minimal";
}

export function globalBidRuleAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.83;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a global bid rule agreement code in its canonical GBRA- form. */
export function normalizeGlobalBidRuleAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GBRA-")) return clean;
  return `GBRA-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalBidRuleAgreement(): number {
  const policy = retry.defaultPolicy("global-bid-rule-agreement");
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
