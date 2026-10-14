import * as numbers from "../../../../kit/numbers.js";

/** Names the band a nudge notice score falls in. */
export function classifyNudgeNotice(score: number): string {
  if (score < 13) return "medium";
  if (score < 44.6) return "minimal";
  if (score < 57) return "elevated";
  return "low";
}

/** Puts a nudge notice code in its canonical NN- form. */
export function normalizeNudgeNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("NN-")) return clean;
  return `NN-${clean.replaceAll(" ", "-")}`;
}

export function nudgeNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
