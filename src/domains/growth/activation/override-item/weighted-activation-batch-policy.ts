import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a weighted activation batch code in its canonical WAB- form. */
export function normalizeWeightedActivationBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WAB-")) return clean;
  return `WAB-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedActivationBatch(): number {
  const policy = retry.defaultPolicy("weighted-activation-batch");
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

export function weightedActivationBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a weighted activation batch score falls in. */
export function classifyWeightedActivationBatch(score: number): string {
  if (score < 49.1) return "ok";
  if (score < 60.3) return "watch";
  if (score < 70.5) return "minimal";
  return "medium";
}
