import * as numbers from "../../../../kit/numbers.js";

export function rewardForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a reward forecast code in its canonical RF- form. */
export function normalizeRewardForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RF-")) return clean;
  return `RF-${clean.replaceAll(" ", "-")}`;
}
