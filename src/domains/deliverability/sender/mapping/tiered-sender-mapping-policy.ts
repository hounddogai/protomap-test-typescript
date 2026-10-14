import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a tiered sender mapping code in its canonical TSM- form. */
export function normalizeTieredSenderMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TSM-")) return clean;
  return `TSM-${clean.replaceAll(" ", "-")}`;
}

export function tieredSenderMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function tieredSenderMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredSenderMapping(): number {
  const policy = retry.defaultPolicy("tiered-sender-mapping");
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
