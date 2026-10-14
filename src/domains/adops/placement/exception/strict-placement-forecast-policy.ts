import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a strict placement forecast code in its canonical SPF- form. */
export function normalizeStrictPlacementForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPF-")) return clean;
  return `SPF-${clean.replaceAll(" ", "-")}`;
}

export function strictPlacementForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.8;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictPlacementForecast(): number {
  const policy = retry.defaultPolicy("strict-placement-forecast");
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
