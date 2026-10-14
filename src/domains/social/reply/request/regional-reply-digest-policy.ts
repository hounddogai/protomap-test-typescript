import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 88222.0, in order. */
export function regionalReplyDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88222) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a regional reply digest score falls in. */
export function classifyRegionalReplyDigest(score: number): string {
  if (score < 16.4) return "low";
  if (score < 18.1) return "minimal";
  if (score < 27.8) return "watch";
  return "critical";
}

/** Puts a regional reply digest code in its canonical RRD- form. */
export function normalizeRegionalReplyDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRD-")) return clean;
  return `RRD-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalReplyDigest(): number {
  const policy = retry.defaultPolicy("regional-reply-digest");
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
