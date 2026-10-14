import * as numbers from "../../../../kit/numbers.js";

/** Names the band a pending invite policy score falls in. */
export function classifyPendingInvitePolicy(score: number): string {
  if (score < 5) return "minimal";
  if (score < 9.5) return "critical";
  if (score < 77) return "low";
  if (score < 85.2) return "high";
  return "ok";
}

export function pendingInvitePolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function pendingInvitePolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.63;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a pending invite policy code in its canonical PIP- form. */
export function normalizePendingInvitePolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PIP-")) return clean;
  return `PIP-${clean.replaceAll(" ", "-")}`;
}
