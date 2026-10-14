import * as numbers from "../../../../kit/numbers.js";

/** Names the band a strict window group score falls in. */
export function classifyStrictWindowGroup(score: number): string {
  if (score < 20.5) return "minimal";
  if (score < 65.2) return "low";
  if (score < 66.2) return "watch";
  return "high";
}

/** Puts a strict window group code in its canonical SWG- form. */
export function normalizeStrictWindowGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SWG-")) return clean;
  return `SWG-${clean.replaceAll(" ", "-")}`;
}

export function strictWindowGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
