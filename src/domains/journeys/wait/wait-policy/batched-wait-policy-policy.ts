import * as numbers from "../../../../kit/numbers.js";

/** Puts a batched wait policy code in its canonical BWP- form. */
export function normalizeBatchedWaitPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BWP-")) return clean;
  return `BWP-${clean.replaceAll(" ", "-")}`;
}

export function batchedWaitPolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
