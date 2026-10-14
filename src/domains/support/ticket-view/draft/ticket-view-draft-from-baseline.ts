import { CappedDeflectionBaseline } from "../../deflection/metric/capped-deflection-baseline.js";
import { normalizeCappedDeflectionBudgetCode } from "../../deflection/metric/capped-deflection-budget-policy.js";
import { TicketViewDraft, newTicketViewDraft } from "./ticket-view-draft.js";

export function summarizeCappedDeflectionBaselinesForDraft(items: CappedDeflectionBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveTicketViewDraftsFromBaseline(items: CappedDeflectionBaseline[]): TicketViewDraft[] {
  const out: TicketViewDraft[] = [];
  for (const item of items) {
    const derived = newTicketViewDraft(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectTicketViewDraft(item: TicketViewDraft): string {
  return normalizeCappedDeflectionBudgetCode(item.code);
}
