import { BatchedDomainSegment } from "../../domain/segment/batched-domain-segment.js";
import { normalizeDomainMetricCode } from "../../domain/segment/domain-metric-policy.js";
import {
  ScheduledReputationAdjustment,
  newScheduledReputationAdjustment,
} from "./scheduled-reputation-adjustment.js";

export function summarizeBatchedDomainSegmentsForAdjustment(items: BatchedDomainSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveScheduledReputationAdjustmentsFromSegment(items: BatchedDomainSegment[]): ScheduledReputationAdjustment[] {
  const out: ScheduledReputationAdjustment[] = [];
  for (const item of items) {
    const derived = newScheduledReputationAdjustment(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceScheduledReputationAdjustment(item: ScheduledReputationAdjustment): string {
  return normalizeDomainMetricCode(item.code);
}
