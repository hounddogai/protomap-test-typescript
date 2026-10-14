import * as numbers from "../../../../kit/numbers.js";

export function escalationLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a escalation ledger code in its canonical EL- form. */
export function normalizeEscalationLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("EL-")) return clean;
  return `EL-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a escalation ledger score falls in. */
export function classifyEscalationLedger(score: number): string {
  if (score < 25.4) return "ok";
  if (score < 65.2) return "watch";
  if (score < 80.7) return "elevated";
  if (score < 93.9) return "low";
  return "critical";
}

export function escalationLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
