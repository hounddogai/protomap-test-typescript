import { normalizeDeflectionBaselineCode } from "../../deflection/segment/deflection-baseline-policy.js";
import { DeflectionManifest } from "../../deflection/segment/deflection-manifest.js";
import { TicketViewAdjustment, newTicketViewAdjustment } from "./ticket-view-adjustment.js";

export function summarizeDeflectionManifestsForAdjustment(items: DeflectionManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTicketViewAdjustmentsFromManifest(items: DeflectionManifest[]): TicketViewAdjustment[] {
  const out: TicketViewAdjustment[] = [];
  for (const item of items) {
    const derived = newTicketViewAdjustment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveTicketViewAdjustmentExtra(item: TicketViewAdjustment): string {
  return normalizeDeflectionBaselineCode(item.code);
}
