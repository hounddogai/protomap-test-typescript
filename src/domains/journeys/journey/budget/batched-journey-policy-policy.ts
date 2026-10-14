import * as numbers from "../../../../kit/numbers.js";

export function batchedJourneyPolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a batched journey policy code in its canonical BJP- form. */
export function normalizeBatchedJourneyPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BJP-")) return clean;
  return `BJP-${clean.replaceAll(" ", "-")}`;
}
