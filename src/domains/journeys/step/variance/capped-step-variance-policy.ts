import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 65206.0, in order. */
export function cappedStepVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 65206) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a capped step variance code in its canonical CSV- form. */
export function normalizeCappedStepVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CSV-")) return clean;
  return `CSV-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedStepVariance(): number {
  const policy = retry.defaultPolicy("capped-step-variance");
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

/** Names the band a capped step variance score falls in. */
export function classifyCappedStepVariance(score: number): string {
  if (score < 33.7) return "watch";
  if (score < 63.7) return "elevated";
  if (score < 97) return "low";
  return "minimal";
}
