import { classifyPrimaryEscalationWindow } from "../../escalation/rule/primary-escalation-window-policy.js";
import { PrimaryEscalationWindow } from "../../escalation/rule/primary-escalation-window.js";
import { TieredTicketViewReview, newTieredTicketViewReview } from "./tiered-ticket-view-review.js";

export function summarizePrimaryEscalationWindowsForReview(items: PrimaryEscalationWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveTieredTicketViewReviewsFromWindow(items: PrimaryEscalationWindow[]): TieredTicketViewReview[] {
  const out: TieredTicketViewReview[] = [];
  for (const item of items) {
    const derived = newTieredTicketViewReview(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignTieredTicketViewReview(item: TieredTicketViewReview): string {
  return classifyPrimaryEscalationWindow(item.adjustedValue());
}
