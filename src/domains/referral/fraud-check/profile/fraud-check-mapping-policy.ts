import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function fraudCheckMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.11;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a fraud check mapping code in its canonical FCM- form. */
export function normalizeFraudCheckMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCM-")) return clean;
  return `FCM-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFraudCheckMapping(): number {
  const policy = retry.defaultPolicy("fraud-check-mapping");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
