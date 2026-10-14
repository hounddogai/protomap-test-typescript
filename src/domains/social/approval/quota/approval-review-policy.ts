import * as numbers from "../../../../kit/numbers.js";

/** Puts a approval review code in its canonical AR- form. */
export function normalizeApprovalReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AR-")) return clean;
  return `AR-${clean.replaceAll(" ", "-")}`;
}

export function approvalReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
