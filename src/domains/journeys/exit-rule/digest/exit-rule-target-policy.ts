import * as numbers from "../../../../kit/numbers.js";

/** Puts a exit rule target code in its canonical ERT- form. */
export function normalizeExitRuleTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ERT-")) return clean;
  return `ERT-${clean.replaceAll(" ", "-")}`;
}

export function exitRuleTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
