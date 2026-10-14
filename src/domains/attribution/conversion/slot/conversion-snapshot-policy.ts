import * as numbers from "../../../../kit/numbers.js";

/** Puts a conversion snapshot code in its canonical CS- form. */
export function normalizeConversionSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CS-")) return clean;
  return `CS-${clean.replaceAll(" ", "-")}`;
}

export function conversionSnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
