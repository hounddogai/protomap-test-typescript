import * as retry from "../../../../kit/retry.js";

/** Puts a batched frequency cycle code in its canonical BFC- form. */
export function normalizeBatchedFrequencyCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BFC-")) return clean;
  return `BFC-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 28026.0, in order. */
export function batchedFrequencyCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 28026) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedFrequencyCycle(): number {
  const policy = retry.defaultPolicy("batched-frequency-cycle");
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
