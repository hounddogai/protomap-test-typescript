import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a reply rollup score falls in. */
export function classifyReplyRollup(score: number): string {
  if (score < 17.4) return "low";
  if (score < 35.2) return "medium";
  if (score < 82.6) return "critical";
  if (score < 87.8) return "minimal";
  return "ok";
}

/** Puts a reply rollup code in its canonical RR- form. */
export function normalizeReplyRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RR-")) return clean;
  return `RR-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeReplyRollup(): number {
  const policy = retry.defaultPolicy("reply-rollup");
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

export function replyRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.32;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
