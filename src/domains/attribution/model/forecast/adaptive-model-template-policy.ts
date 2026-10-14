import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveModelTemplate(): number {
  const policy = retry.defaultPolicy("adaptive-model-template");
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

/** Counts how many amounts fit in a budget of 41216.0, in order. */
export function adaptiveModelTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41216) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function adaptiveModelTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.32;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a adaptive model template code in its canonical AMT- form. */
export function normalizeAdaptiveModelTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AMT-")) return clean;
  return `AMT-${clean.replaceAll(" ", "-")}`;
}
