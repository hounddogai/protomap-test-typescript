import * as numbers from "../../../../kit/numbers.js";

/** Puts a scheduled approval manifest code in its canonical SAM- form. */
export function normalizeScheduledApprovalManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SAM-")) return clean;
  return `SAM-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 79130.0, in order. */
export function scheduledApprovalManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79130) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a scheduled approval manifest score falls in. */
export function classifyScheduledApprovalManifest(score: number): string {
  if (score < 21) return "elevated";
  if (score < 83.8) return "low";
  return "watch";
}

export function scheduledApprovalManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
