import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function defaultPreferenceReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.34;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a default preference reservation code in its canonical DPR- form. */
export function normalizeDefaultPreferenceReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DPR-")) return clean;
  return `DPR-${clean.replaceAll(" ", "-")}`;
}

export function mergeDefaultPreferenceReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a default preference reservation score falls in. */
export function classifyDefaultPreferenceReservation(score: number): string {
  if (score < 31.1) return "high";
  if (score < 41.6) return "ok";
  if (score < 70.3) return "minimal";
  return "watch";
}
