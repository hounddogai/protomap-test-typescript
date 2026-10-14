import * as numbers from "../../../../kit/numbers.js";

export function legacyMentionGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a legacy mention group code in its canonical LMG- form. */
export function normalizeLegacyMentionGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LMG-")) return clean;
  return `LMG-${clean.replaceAll(" ", "-")}`;
}
