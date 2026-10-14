import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a scheduled retention allocation code in its canonical SRA- form. */
export function normalizeScheduledRetentionAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRA-")) return clean;
  return `SRA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a scheduled retention allocation score falls in. */
export function classifyScheduledRetentionAllocation(score: number): string {
  if (score < 80.1) return "ok";
  if (score < 99.3) return "watch";
  return "low";
}

export function scheduledRetentionAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledRetentionAllocation(): number {
  const policy = retry.defaultPolicy("scheduled-retention-allocation");
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
