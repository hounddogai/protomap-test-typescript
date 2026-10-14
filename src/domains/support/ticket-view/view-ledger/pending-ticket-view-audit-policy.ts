import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a pending ticket view audit code in its canonical PTVA- form. */
export function normalizePendingTicketViewAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PTVA-")) return clean;
  return `PTVA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a pending ticket view audit score falls in. */
export function classifyPendingTicketViewAudit(score: number): string {
  if (score < 57.4) return "critical";
  if (score < 72) return "elevated";
  return "high";
}

export function mergePendingTicketViewAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function pendingTicketViewAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.75;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
