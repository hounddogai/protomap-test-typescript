import * as numbers from "../../../../kit/numbers.js";

export function subscriptionAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.84;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a subscription audit score falls in. */
export function classifySubscriptionAudit(score: number): string {
  if (score < 25.4) return "minimal";
  if (score < 30.7) return "watch";
  if (score < 91.7) return "medium";
  return "high";
}

/** Puts a subscription audit code in its canonical SA- form. */
export function normalizeSubscriptionAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SA-")) return clean;
  return `SA-${clean.replaceAll(" ", "-")}`;
}

export function subscriptionAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
