import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeActivationMapping(): number {
  const policy = retry.defaultPolicy("activation-mapping");
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

/** Puts a activation mapping code in its canonical AM- form. */
export function normalizeActivationMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AM-")) return clean;
  return `AM-${clean.replaceAll(" ", "-")}`;
}

export function activationMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function activationMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.17;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
