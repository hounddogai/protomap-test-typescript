import { BatchedFlightSnapshot } from "../../flight/quota/batched-flight-snapshot.js";
import { normalizeFlightAuditCode } from "../../flight/quota/flight-audit-policy.js";
import { CreativeSegment, newCreativeSegment } from "./creative-segment.js";

export function summarizeBatchedFlightSnapshotsForSegment(items: BatchedFlightSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveCreativeSegmentsFromSnapshot(items: BatchedFlightSnapshot[]): CreativeSegment[] {
  const out: CreativeSegment[] = [];
  for (const item of items) {
    const derived = newCreativeSegment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectCreativeSegmentExtra(item: CreativeSegment): string {
  return normalizeFlightAuditCode(item.code);
}
