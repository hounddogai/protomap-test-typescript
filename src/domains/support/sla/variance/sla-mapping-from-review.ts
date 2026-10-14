import { LenientTicketViewReview } from "../../ticket-view/review/lenient-ticket-view-review.js";
import { classifyTicketViewThreshold } from "../../ticket-view/review/ticket-view-threshold-policy.js";
import { SlaMapping, newSlaMapping } from "./sla-mapping.js";

export function summarizeLenientTicketViewReviewsForMapping(items: LenientTicketViewReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveSlaMappingsFromReview(items: LenientTicketViewReview[]): SlaMapping[] {
  const out: SlaMapping[] = [];
  for (const item of items) {
    const derived = newSlaMapping(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveSlaMapping(item: SlaMapping): string {
  return classifyTicketViewThreshold(item.effectiveTotal());
}
