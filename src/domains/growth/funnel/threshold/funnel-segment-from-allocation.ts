import { normalizeActivationAllocationCode } from "../../activation/allocation/activation-allocation-policy.js";
import { ActivationAllocation } from "../../activation/allocation/activation-allocation.js";
import { FunnelSegment, newFunnelSegment } from "./funnel-segment.js";

export function summarizeActivationAllocationsForSegment(items: ActivationAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveFunnelSegmentsFromAllocation(items: ActivationAllocation[]): FunnelSegment[] {
  const out: FunnelSegment[] = [];
  for (const item of items) {
    const derived = newFunnelSegment(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreFunnelSegment(item: FunnelSegment): string {
  return normalizeActivationAllocationCode(item.code);
}
