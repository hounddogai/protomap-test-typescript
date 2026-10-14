import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 18256.0, in order. */
export function globalModelExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18256) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function globalModelExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a global model exception code in its canonical GME- form. */
export function normalizeGlobalModelExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GME-")) return clean;
  return `GME-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalModelException(): number {
  const policy = retry.defaultPolicy("global-model-exception");
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
