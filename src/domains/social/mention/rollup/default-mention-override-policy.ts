import * as numbers from "../../../../kit/numbers.js";

/** Puts a default mention override code in its canonical DMO- form. */
export function normalizeDefaultMentionOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DMO-")) return clean;
  return `DMO-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a default mention override score falls in. */
export function classifyDefaultMentionOverride(score: number): string {
  if (score < 57.4) return "minimal";
  if (score < 75.4) return "ok";
  if (score < 91.7) return "low";
  return "medium";
}

export function defaultMentionOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
