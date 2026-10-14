import * as numbers from "../../../../kit/numbers.js";

/** Puts a manual wait digest code in its canonical MWD- form. */
export function normalizeManualWaitDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MWD-")) return clean;
  return `MWD-${clean.replaceAll(" ", "-")}`;
}

export function manualWaitDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
