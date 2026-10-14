import { classifyConversionSlot } from "../../conversion/slot/conversion-slot-policy.js";
import { ConversionSnapshot } from "../../conversion/slot/conversion-snapshot.js";
import { CreditAllocation, newCreditAllocation } from "./credit-allocation.js";

export function summarizeConversionSnapshotsForAllocation(items: ConversionSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveCreditAllocationsFromSnapshot(items: ConversionSnapshot[]): CreditAllocation[] {
  const out: CreditAllocation[] = [];
  for (const item of items) {
    const derived = newCreditAllocation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyCreditAllocationExtra(item: CreditAllocation): string {
  return classifyConversionSlot(item.projectedVolume());
}
