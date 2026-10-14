import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 66091.0, in order. */
export function weightedFrequencyExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66091) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a weighted frequency exception code in its canonical WFE- form. */
export function normalizeWeightedFrequencyExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WFE-")) return clean;
  return `WFE-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedFrequencyException(): number {
  const policy = retry.defaultPolicy("weighted-frequency-exception");
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
