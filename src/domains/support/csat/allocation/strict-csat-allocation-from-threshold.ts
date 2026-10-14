import { normalizeLenientTicketViewReviewCode } from "../../ticket-view/review/lenient-ticket-view-review-policy.js";
import { TicketViewThreshold } from "../../ticket-view/review/ticket-view-threshold.js";
import { StrictCsatAllocation, newStrictCsatAllocation } from "./strict-csat-allocation.js";

export function summarizeTicketViewThresholdsForAllocation(items: TicketViewThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveStrictCsatAllocationsFromThreshold(items: TicketViewThreshold[]): StrictCsatAllocation[] {
  const out: StrictCsatAllocation[] = [];
  for (const item of items) {
    const derived = newStrictCsatAllocation(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeStrictCsatAllocation(item: StrictCsatAllocation): string {
  return normalizeLenientTicketViewReviewCode(item.code);
}
