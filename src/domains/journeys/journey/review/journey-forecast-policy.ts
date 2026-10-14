import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function journeyForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.6;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a journey forecast code in its canonical JF- form. */
export function normalizeJourneyForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("JF-")) return clean;
  return `JF-${clean.replaceAll(" ", "-")}`;
}

export function mergeJourneyForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeJourneyForecast(): number {
  const policy = retry.defaultPolicy("journey-forecast");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
