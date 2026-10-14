import { weightedWindowGroupWeight } from "../request/weighted-window-group-policy.js";
import { WeightedWindowGroup } from "../request/weighted-window-group.js";
import { FallbackWindowClaim, newFallbackWindowClaim } from "./fallback-window-claim.js";

export function summarizeWeightedWindowGroupsForClaim(items: WeightedWindowGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveFallbackWindowClaimsFromGroup(items: WeightedWindowGroup[]): FallbackWindowClaim[] {
  const out: FallbackWindowClaim[] = [];
  for (const item of items) {
    const derived = newFallbackWindowClaim(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveFallbackWindowClaim(item: FallbackWindowClaim): number {
  return weightedWindowGroupWeight(4, true);
}
