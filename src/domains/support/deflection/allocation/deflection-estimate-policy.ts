import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDeflectionEstimate(): number {
  const policy = retry.defaultPolicy("deflection-estimate");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function deflectionEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a deflection estimate code in its canonical DE- form. */
export function normalizeDeflectionEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DE-")) return clean;
  return `DE-${clean.replaceAll(" ", "-")}`;
}
