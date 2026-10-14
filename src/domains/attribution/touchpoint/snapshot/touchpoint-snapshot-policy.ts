import * as retry from "../../../../kit/retry.js";

export function touchpointSnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Puts a touchpoint snapshot code in its canonical TS- form. */
export function normalizeTouchpointSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TS-")) return clean;
  return `TS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTouchpointSnapshot(): number {
  const policy = retry.defaultPolicy("touchpoint-snapshot");
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

/** Names the band a touchpoint snapshot score falls in. */
export function classifyTouchpointSnapshot(score: number): string {
  if (score < 29.5) return "watch";
  if (score < 31.7) return "critical";
  return "high";
}
