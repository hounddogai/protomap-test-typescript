import { normalizeManualBounceExceptionCode } from "../../bounce/bounce-record/manual-bounce-exception-policy.js";
import { TieredBounceMilestone } from "../../bounce/bounce-record/tiered-bounce-milestone.js";
import { BatchedWarmupTemplate, newBatchedWarmupTemplate } from "./batched-warmup-template.js";

export function summarizeTieredBounceMilestonesForTemplate(items: TieredBounceMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveBatchedWarmupTemplatesFromMilestone(items: TieredBounceMilestone[]): BatchedWarmupTemplate[] {
  const out: BatchedWarmupTemplate[] = [];
  for (const item of items) {
    const derived = newBatchedWarmupTemplate(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitBatchedWarmupTemplate(item: BatchedWarmupTemplate): string {
  return normalizeManualBounceExceptionCode(item.code);
}
