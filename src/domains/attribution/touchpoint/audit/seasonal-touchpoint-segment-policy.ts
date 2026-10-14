import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a seasonal touchpoint segment code in its canonical STS- form. */
export function normalizeSeasonalTouchpointSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("STS-")) return clean;
  return `STS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalTouchpointSegment(): number {
  const policy = retry.defaultPolicy("seasonal-touchpoint-segment");
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

/** Names the band a seasonal touchpoint segment score falls in. */
export function classifySeasonalTouchpointSegment(score: number): string {
  if (score < 36.5) return "critical";
  if (score < 62.2) return "ok";
  return "medium";
}

export function seasonalTouchpointSegmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.78;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
