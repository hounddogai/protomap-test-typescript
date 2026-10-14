import * as numbers from "../../../../kit/numbers.js";

export function lenientWarmupDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a lenient warmup draft code in its canonical LWD- form. */
export function normalizeLenientWarmupDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LWD-")) return clean;
  return `LWD-${clean.replaceAll(" ", "-")}`;
}
