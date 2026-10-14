import { normalizeBidRuleReviewCode } from "../../bid-rule/window/bid-rule-review-policy.js";
import { FallbackBidRuleWindow } from "../../bid-rule/window/fallback-bid-rule-window.js";
import { DefaultPlacementEstimate, newDefaultPlacementEstimate } from "./default-placement-estimate.js";

export function summarizeFallbackBidRuleWindowsForEstimate(items: FallbackBidRuleWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveDefaultPlacementEstimatesFromWindow(items: FallbackBidRuleWindow[]): DefaultPlacementEstimate[] {
  const out: DefaultPlacementEstimate[] = [];
  for (const item of items) {
    const derived = newDefaultPlacementEstimate(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveDefaultPlacementEstimate(item: DefaultPlacementEstimate): string {
  return normalizeBidRuleReviewCode(item.code);
}
