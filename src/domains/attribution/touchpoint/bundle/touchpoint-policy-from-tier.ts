import { globalWindowReviewWeight } from "../../window/window-review/global-window-review-policy.js";
import { WindowTier } from "../../window/window-review/window-tier.js";
import { TouchpointPolicy, newTouchpointPolicy } from "./touchpoint-policy.js";

export function summarizeWindowTiersForPolicy(items: WindowTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveTouchpointPoliciesFromTier(items: WindowTier[]): TouchpointPolicy[] {
  const out: TouchpointPolicy[] = [];
  for (const item of items) {
    const derived = newTouchpointPolicy(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeTouchpointPolicy(item: TouchpointPolicy): number {
  return globalWindowReviewWeight(2, true);
}
