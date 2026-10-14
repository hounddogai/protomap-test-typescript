import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a strict payout segment code in its canonical SPS- form. */
export function normalizeStrictPayoutSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPS-")) return clean;
  return `SPS-${clean.replaceAll(" ", "-")}`;
}

export function strictPayoutSegmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a strict payout segment score falls in. */
export function classifyStrictPayoutSegment(score: number): string {
  if (score < 26.7) return "minimal";
  if (score < 83.4) return "medium";
  if (score < 97) return "watch";
  if (score < 99.4) return "low";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictPayoutSegment(): number {
  const policy = retry.defaultPolicy("strict-payout-segment");
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
