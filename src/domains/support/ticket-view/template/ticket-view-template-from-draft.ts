import { PendingCsatDraft } from "../../csat/allocation/pending-csat-draft.js";
import { classifyStrictCsatAllocation } from "../../csat/allocation/strict-csat-allocation-policy.js";
import { TicketViewTemplate, newTicketViewTemplate } from "./ticket-view-template.js";

export function summarizePendingCsatDraftsForTemplate(items: PendingCsatDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTicketViewTemplatesFromDraft(items: PendingCsatDraft[]): TicketViewTemplate[] {
  const out: TicketViewTemplate[] = [];
  for (const item of items) {
    const derived = newTicketViewTemplate(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settleTicketViewTemplate(item: TicketViewTemplate): string {
  return classifyStrictCsatAllocation(item.weightedLoad());
}
