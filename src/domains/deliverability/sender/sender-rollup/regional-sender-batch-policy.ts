import * as numbers from "../../../../kit/numbers.js";

/** Puts a regional sender batch code in its canonical RSB- form. */
export function normalizeRegionalSenderBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RSB-")) return clean;
  return `RSB-${clean.replaceAll(" ", "-")}`;
}

export function regionalSenderBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
