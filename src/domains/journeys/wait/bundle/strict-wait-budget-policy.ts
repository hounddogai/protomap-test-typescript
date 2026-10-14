import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictWaitBudget(): number {
  const policy = retry.defaultPolicy("strict-wait-budget");
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

/** Puts a strict wait budget code in its canonical SWB- form. */
export function normalizeStrictWaitBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SWB-")) return clean;
  return `SWB-${clean.replaceAll(" ", "-")}`;
}
