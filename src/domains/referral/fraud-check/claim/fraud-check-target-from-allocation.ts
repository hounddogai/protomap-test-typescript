import { normalizePayoutAllocationCode } from "../../payout/budget/payout-allocation-policy.js";
import { PayoutAllocation } from "../../payout/budget/payout-allocation.js";
import { FraudCheckTarget, newFraudCheckTarget } from "./fraud-check-target.js";

export function summarizePayoutAllocationsForTarget(items: PayoutAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveFraudCheckTargetsFromAllocation(items: PayoutAllocation[]): FraudCheckTarget[] {
  const out: FraudCheckTarget[] = [];
  for (const item of items) {
    const derived = newFraudCheckTarget(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeFraudCheckTarget(item: FraudCheckTarget): string {
  return normalizePayoutAllocationCode(item.code);
}
