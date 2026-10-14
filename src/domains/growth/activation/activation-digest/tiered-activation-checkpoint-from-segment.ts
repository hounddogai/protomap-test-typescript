import { nudgeAuditBucket } from "../../nudge/nudge-batch/nudge-audit-policy.js";
import { NudgeSegment } from "../../nudge/nudge-batch/nudge-segment.js";
import { TieredActivationCheckpoint, newTieredActivationCheckpoint } from "./tiered-activation-checkpoint.js";

export function summarizeNudgeSegmentsForCheckpoint(items: NudgeSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveTieredActivationCheckpointsFromSegment(items: NudgeSegment[]): TieredActivationCheckpoint[] {
  const out: TieredActivationCheckpoint[] = [];
  for (const item of items) {
    const derived = newTieredActivationCheckpoint(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignTieredActivationCheckpoint(item: TieredActivationCheckpoint): string {
  return nudgeAuditBucket(item.effectiveTotal());
}
