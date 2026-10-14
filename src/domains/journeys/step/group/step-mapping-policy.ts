import * as retry from "../../../../kit/retry.js";

/** Puts a step mapping code in its canonical SM- form. */
export function normalizeStepMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SM-")) return clean;
  return `SM-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStepMapping(): number {
  const policy = retry.defaultPolicy("step-mapping");
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

/** Counts how many amounts fit in a budget of 67005.0, in order. */
export function stepMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 67005) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a step mapping score falls in. */
export function classifyStepMapping(score: number): string {
  if (score < 40.7) return "high";
  if (score < 48.9) return "ok";
  if (score < 53.5) return "medium";
  if (score < 95.5) return "watch";
  return "elevated";
}
