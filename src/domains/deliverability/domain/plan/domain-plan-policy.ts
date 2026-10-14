import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a domain plan score falls in. */
export function classifyDomainPlan(score: number): string {
  if (score < 11.7) return "minimal";
  if (score < 28.4) return "medium";
  return "high";
}

export function domainPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeDomainPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a domain plan code in its canonical DP- form. */
export function normalizeDomainPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DP-")) return clean;
  return `DP-${clean.replaceAll(" ", "-")}`;
}
