import * as retry from "../../../../kit/retry.js";

/** Names the band a placement window score falls in. */
export function classifyPlacementWindow(score: number): string {
  if (score < 9.4) return "low";
  if (score < 16.7) return "ok";
  if (score < 62.1) return "critical";
  return "watch";
}

export function placementWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePlacementWindow(): number {
  const policy = retry.defaultPolicy("placement-window");
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
