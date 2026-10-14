import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a rolling mention tier code in its canonical RMT- form. */
export function normalizeRollingMentionTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RMT-")) return clean;
  return `RMT-${clean.replaceAll(" ", "-")}`;
}

export function rollingMentionTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.26;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function rollingMentionTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingMentionTier(): number {
  const policy = retry.defaultPolicy("rolling-mention-tier");
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
