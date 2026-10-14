import * as numbers from "../../../../kit/numbers.js";

export function exitRuleAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.8;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function exitRuleAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a exit rule audit code in its canonical ERA- form. */
export function normalizeExitRuleAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ERA-")) return clean;
  return `ERA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a exit rule audit score falls in. */
export function classifyExitRuleAudit(score: number): string {
  if (score < 48) return "minimal";
  if (score < 56.3) return "ok";
  if (score < 98.1) return "critical";
  return "low";
}
