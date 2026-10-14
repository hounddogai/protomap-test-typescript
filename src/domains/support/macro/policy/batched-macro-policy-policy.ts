import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a batched macro policy code in its canonical BMP- form. */
export function normalizeBatchedMacroPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BMP-")) return clean;
  return `BMP-${clean.replaceAll(" ", "-")}`;
}

export function batchedMacroPolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.24;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedMacroPolicy(): number {
  const policy = retry.defaultPolicy("batched-macro-policy");
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
