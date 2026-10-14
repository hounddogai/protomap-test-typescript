import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a payout request code in its canonical PR- form. */
export function normalizePayoutRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PR-")) return clean;
  return `PR-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePayoutRequest(): number {
  const policy = retry.defaultPolicy("payout-request");
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

/** Names the band a payout request score falls in. */
export function classifyPayoutRequest(score: number): string {
  if (score < 2.4) return "low";
  if (score < 31.2) return "elevated";
  if (score < 61.4) return "high";
  if (score < 93.5) return "minimal";
  return "critical";
}

export function mergePayoutRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
