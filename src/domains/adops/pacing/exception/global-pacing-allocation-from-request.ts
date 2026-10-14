import { globalPacingRequestWeight } from "../mapping/global-pacing-request-policy.js";
import { GlobalPacingRequest } from "../mapping/global-pacing-request.js";
import { GlobalPacingAllocation, newGlobalPacingAllocation } from "./global-pacing-allocation.js";

export function summarizeGlobalPacingRequestsForAllocation(items: GlobalPacingRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveGlobalPacingAllocationsFromRequest(items: GlobalPacingRequest[]): GlobalPacingAllocation[] {
  const out: GlobalPacingAllocation[] = [];
  for (const item of items) {
    const derived = newGlobalPacingAllocation(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveGlobalPacingAllocation(item: GlobalPacingAllocation): number {
  return globalPacingRequestWeight(6, true);
}
