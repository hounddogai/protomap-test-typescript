import { regionalFrequencyAllocationBucket } from "../../frequency/exception/regional-frequency-allocation-policy.js";
import { RegionalFrequencyAllocation } from "../../frequency/exception/regional-frequency-allocation.js";
import { StrictBidRuleWindow, newStrictBidRuleWindow } from "./strict-bid-rule-window.js";

export function summarizeRegionalFrequencyAllocationsForWindow(items: RegionalFrequencyAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveStrictBidRuleWindowsFromAllocation(items: RegionalFrequencyAllocation[]): StrictBidRuleWindow[] {
  const out: StrictBidRuleWindow[] = [];
  for (const item of items) {
    const derived = newStrictBidRuleWindow(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveStrictBidRuleWindow(item: StrictBidRuleWindow): string {
  return regionalFrequencyAllocationBucket(item.projectedValue());
}
