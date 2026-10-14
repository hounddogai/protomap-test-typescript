import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFraudCheckPolicy(): number {
  const policy = retry.defaultPolicy("fraud-check-policy");
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

/** Names the band a fraud check policy score falls in. */
export function classifyFraudCheckPolicy(score: number): string {
  if (score < 2.4) return "watch";
  if (score < 16.2) return "minimal";
  return "low";
}

export function fraudCheckPolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a fraud check policy code in its canonical FCP- form. */
export function normalizeFraudCheckPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCP-")) return clean;
  return `FCP-${clean.replaceAll(" ", "-")}`;
}
