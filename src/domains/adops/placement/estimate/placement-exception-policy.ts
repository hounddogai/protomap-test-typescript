import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a placement exception code in its canonical PE- form. */
export function normalizePlacementExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PE-")) return clean;
  return `PE-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a placement exception score falls in. */
export function classifyPlacementException(score: number): string {
  if (score < 61) return "elevated";
  if (score < 78.4) return "minimal";
  return "ok";
}

export function placementExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.26;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePlacementException(): number {
  const policy = retry.defaultPolicy("placement-exception");
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
