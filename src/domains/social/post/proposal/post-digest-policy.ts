import * as numbers from "../../../../kit/numbers.js";

export function postDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a post digest code in its canonical PD- form. */
export function normalizePostDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PD-")) return clean;
  return `PD-${clean.replaceAll(" ", "-")}`;
}
