import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a rolling queue record score falls in. */
export function classifyRollingQueueRecord(score: number): string {
  if (score < 24.3) return "watch";
  if (score < 26.1) return "high";
  if (score < 79.9) return "elevated";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingQueueRecord(): number {
  const policy = retry.defaultPolicy("rolling-queue-record");
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

export function rollingQueueRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a rolling queue record code in its canonical RQR- form. */
export function normalizeRollingQueueRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RQR-")) return clean;
  return `RQR-${clean.replaceAll(" ", "-")}`;
}
