import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function legacyWindowSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.44;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a legacy window summary score falls in. */
export function classifyLegacyWindowSummary(score: number): string {
  if (score < 48.5) return "high";
  if (score < 64.1) return "critical";
  if (score < 70.8) return "medium";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyWindowSummary(): number {
  const policy = retry.defaultPolicy("legacy-window-summary");
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

export function legacyWindowSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
