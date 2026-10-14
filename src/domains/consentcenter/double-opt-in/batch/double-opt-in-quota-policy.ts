import * as retry from "../../../../kit/retry.js";

/** Puts a double opt in quota code in its canonical DOIQ- form. */
export function normalizeDoubleOptInQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DOIQ-")) return clean;
  return `DOIQ-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 23734.0, in order. */
export function doubleOptInQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 23734) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a double opt in quota score falls in. */
export function classifyDoubleOptInQuota(score: number): string {
  if (score < 28.4) return "minimal";
  if (score < 69.8) return "critical";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDoubleOptInQuota(): number {
  const policy = retry.defaultPolicy("double-opt-in-quota");
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
