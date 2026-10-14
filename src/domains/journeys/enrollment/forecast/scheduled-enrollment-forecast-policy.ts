import * as numbers from "../../../../kit/numbers.js";

export function scheduledEnrollmentForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a scheduled enrollment forecast code in its canonical SEF- form. */
export function normalizeScheduledEnrollmentForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SEF-")) return clean;
  return `SEF-${clean.replaceAll(" ", "-")}`;
}
