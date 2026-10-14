import * as numbers from "../../../../kit/numbers.js";

/** Puts a flight manifest code in its canonical FM- form. */
export function normalizeFlightManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FM-")) return clean;
  return `FM-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a flight manifest score falls in. */
export function classifyFlightManifest(score: number): string {
  if (score < 20.9) return "minimal";
  if (score < 70.7) return "low";
  if (score < 74.6) return "high";
  if (score < 82.5) return "watch";
  return "elevated";
}

export function flightManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 30156.0, in order. */
export function flightManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30156) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
