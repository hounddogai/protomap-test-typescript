import { normalizeBadgeAllocationCode } from "../../badge/profile/badge-allocation-policy.js";
import { BadgeAllocation } from "../../badge/profile/badge-allocation.js";
import { RedemptionException, newRedemptionException } from "./redemption-exception.js";

export function summarizeBadgeAllocationsForException(items: BadgeAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRedemptionExceptionsFromAllocation(items: BadgeAllocation[]): RedemptionException[] {
  const out: RedemptionException[] = [];
  for (const item of items) {
    const derived = newRedemptionException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planRedemptionException(item: RedemptionException): string {
  return normalizeBadgeAllocationCode(item.code);
}
