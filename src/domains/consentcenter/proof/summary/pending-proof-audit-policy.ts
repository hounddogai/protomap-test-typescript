import * as numbers from "../../../../kit/numbers.js";

export function pendingProofAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.93;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a pending proof audit score falls in. */
export function classifyPendingProofAudit(score: number): string {
  if (score < 23.1) return "ok";
  if (score < 61.4) return "high";
  if (score < 99.8) return "critical";
  return "watch";
}

/** Puts a pending proof audit code in its canonical PPA- form. */
export function normalizePendingProofAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPA-")) return clean;
  return `PPA-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 58312.0, in order. */
export function pendingProofAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 58312) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
