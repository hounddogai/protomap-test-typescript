import * as retry from "../../../../kit/retry.js";

/** Names the band a batched reply claim score falls in. */
export function classifyBatchedReplyClaim(score: number): string {
  if (score < 57.5) return "high";
  if (score < 58.9) return "minimal";
  if (score < 73.9) return "ok";
  return "watch";
}

/** Counts how many amounts fit in a budget of 51424.0, in order. */
export function batchedReplyClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 51424) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedReplyClaim(): number {
  const policy = retry.defaultPolicy("batched-reply-claim");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a batched reply claim code in its canonical BRC- form. */
export function normalizeBatchedReplyClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRC-")) return clean;
  return `BRC-${clean.replaceAll(" ", "-")}`;
}
