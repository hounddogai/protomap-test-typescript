import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a funnel window score falls in. */
export function classifyFunnelWindow(score: number): string {
  if (score < 23.6) return "medium";
  if (score < 59.2) return "minimal";
  if (score < 65.3) return "critical";
  return "elevated";
}

/** Puts a funnel window code in its canonical FW- form. */
export function normalizeFunnelWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FW-")) return clean;
  return `FW-${clean.replaceAll(" ", "-")}`;
}

export function funnelWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.73;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeFunnelWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
