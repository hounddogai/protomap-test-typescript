import * as numbers from "../../../../kit/numbers.js";

/** Names the band a default sender score score falls in. */
export function classifyDefaultSenderScore(score: number): string {
  if (score < 1.3) return "critical";
  if (score < 22.1) return "watch";
  if (score < 67) return "ok";
  if (score < 72.8) return "minimal";
  return "low";
}

export function defaultSenderScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a default sender score code in its canonical DSS- form. */
export function normalizeDefaultSenderScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DSS-")) return clean;
  return `DSS-${clean.replaceAll(" ", "-")}`;
}
