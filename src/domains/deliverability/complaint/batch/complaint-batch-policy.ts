import * as numbers from "../../../../kit/numbers.js";

/** Names the band a complaint batch score falls in. */
export function classifyComplaintBatch(score: number): string {
  if (score < 30.6) return "low";
  if (score < 44.7) return "medium";
  if (score < 87.2) return "critical";
  if (score < 95.3) return "ok";
  return "minimal";
}

export function complaintBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function complaintBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.05;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a complaint batch code in its canonical CB- form. */
export function normalizeComplaintBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CB-")) return clean;
  return `CB-${clean.replaceAll(" ", "-")}`;
}
