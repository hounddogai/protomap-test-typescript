import * as numbers from "../../../../kit/numbers.js";

/** Puts a batched conversion record code in its canonical BCR- form. */
export function normalizeBatchedConversionRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BCR-")) return clean;
  return `BCR-${clean.replaceAll(" ", "-")}`;
}

export function batchedConversionRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
