import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 39832.0, in order. */
export function conversionTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39832) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeConversionTarget(): number {
  const policy = retry.defaultPolicy("conversion-target");
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

/** Puts a conversion target code in its canonical CT- form. */
export function normalizeConversionTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CT-")) return clean;
  return `CT-${clean.replaceAll(" ", "-")}`;
}
