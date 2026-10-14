import * as retry from "../../../../kit/retry.js";

/** Puts a strict fraud check checkpoint code in its canonical SFCC- form. */
export function normalizeStrictFraudCheckCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SFCC-")) return clean;
  return `SFCC-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictFraudCheckCheckpoint(): number {
  const policy = retry.defaultPolicy("strict-fraud-check-checkpoint");
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

export function strictFraudCheckCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a strict fraud check checkpoint score falls in. */
export function classifyStrictFraudCheckCheckpoint(score: number): string {
  if (score < 1.8) return "low";
  if (score < 57.3) return "critical";
  if (score < 94.6) return "watch";
  return "elevated";
}
