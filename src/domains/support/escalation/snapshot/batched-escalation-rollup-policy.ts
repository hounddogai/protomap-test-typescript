import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedEscalationRollup(): number {
  const policy = retry.defaultPolicy("batched-escalation-rollup");
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

/** Puts a batched escalation rollup code in its canonical BER- form. */
export function normalizeBatchedEscalationRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BER-")) return clean;
  return `BER-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a batched escalation rollup score falls in. */
export function classifyBatchedEscalationRollup(score: number): string {
  if (score < 33.5) return "high";
  if (score < 70.8) return "minimal";
  return "medium";
}

export function batchedEscalationRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
