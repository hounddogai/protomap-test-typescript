import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a regional conversion slot code in its canonical RCS- form. */
export function normalizeRegionalConversionSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCS-")) return clean;
  return `RCS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalConversionSlot(): number {
  const policy = retry.defaultPolicy("regional-conversion-slot");
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

export function regionalConversionSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a regional conversion slot score falls in. */
export function classifyRegionalConversionSlot(score: number): string {
  if (score < 36.2) return "low";
  if (score < 53.3) return "critical";
  if (score < 70.6) return "watch";
  if (score < 77.1) return "ok";
  return "minimal";
}
