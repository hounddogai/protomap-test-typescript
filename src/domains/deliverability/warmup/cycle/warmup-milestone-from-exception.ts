import { normalizeBatchedWarmupBatchCode } from "../override-item/batched-warmup-batch-policy.js";
import { DefaultWarmupException } from "../override-item/default-warmup-exception.js";
import { WarmupMilestone, newWarmupMilestone } from "./warmup-milestone.js";

export function summarizeDefaultWarmupExceptionsForMilestone(items: DefaultWarmupException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveWarmupMilestonesFromException(items: DefaultWarmupException[]): WarmupMilestone[] {
  const out: WarmupMilestone[] = [];
  for (const item of items) {
    const derived = newWarmupMilestone(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settleWarmupMilestone(item: WarmupMilestone): string {
  return normalizeBatchedWarmupBatchCode(item.code);
}
