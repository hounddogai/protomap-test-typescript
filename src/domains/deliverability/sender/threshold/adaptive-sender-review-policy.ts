import * as numbers from "../../../../kit/numbers.js";

export function adaptiveSenderReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a adaptive sender review code in its canonical ASR- form. */
export function normalizeAdaptiveSenderReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ASR-")) return clean;
  return `ASR-${clean.replaceAll(" ", "-")}`;
}
