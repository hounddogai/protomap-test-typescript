import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedWarmupLedger(): number {
  const policy = retry.defaultPolicy("batched-warmup-ledger");
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

export function batchedWarmupLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a batched warmup ledger code in its canonical BWL- form. */
export function normalizeBatchedWarmupLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BWL-")) return clean;
  return `BWL-${clean.replaceAll(" ", "-")}`;
}
