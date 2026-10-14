import { normalizeFlightMetricCode } from "../../flight/snapshot/flight-metric-policy.js";
import { FlightSnapshot } from "../../flight/snapshot/flight-snapshot.js";
import { CreativeAllocation, newCreativeAllocation } from "./creative-allocation.js";

export function summarizeFlightSnapshotsForAllocation(items: FlightSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveCreativeAllocationsFromSnapshot(items: FlightSnapshot[]): CreativeAllocation[] {
  const out: CreativeAllocation[] = [];
  for (const item of items) {
    const derived = newCreativeAllocation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectCreativeAllocation(item: CreativeAllocation): string {
  return normalizeFlightMetricCode(item.code);
}
