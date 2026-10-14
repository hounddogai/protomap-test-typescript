import { classifyLegacyTicketViewSlot } from "../../ticket-view/template/legacy-ticket-view-slot-policy.js";
import { TieredTicketViewAdjustment } from "../../ticket-view/template/tiered-ticket-view-adjustment.js";
import { DeflectionReview, newDeflectionReview } from "./deflection-review.js";

export function summarizeTieredTicketViewAdjustmentsForReview(items: TieredTicketViewAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDeflectionReviewsFromAdjustment(items: TieredTicketViewAdjustment[]): DeflectionReview[] {
  const out: DeflectionReview[] = [];
  for (const item of items) {
    const derived = newDeflectionReview(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchDeflectionReview(item: DeflectionReview): string {
  return classifyLegacyTicketViewSlot(item.projectedLoad());
}
