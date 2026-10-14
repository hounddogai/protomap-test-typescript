import {
  normalizeGlobalFraudCheckMappingCode,
} from "../../fraud-check/check-policy/global-fraud-check-mapping-policy.js";
import { ScheduledFraudCheckTemplate } from "../../fraud-check/check-policy/scheduled-fraud-check-template.js";
import { BatchedTierAllocation, newBatchedTierAllocation } from "./batched-tier-allocation.js";

export function summarizeScheduledFraudCheckTemplatesForAllocation(items: ScheduledFraudCheckTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveBatchedTierAllocationsFromTemplate(items: ScheduledFraudCheckTemplate[]): BatchedTierAllocation[] {
  const out: BatchedTierAllocation[] = [];
  for (const item of items) {
    const derived = newBatchedTierAllocation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateBatchedTierAllocation(item: BatchedTierAllocation): string {
  return normalizeGlobalFraudCheckMappingCode(item.code);
}
