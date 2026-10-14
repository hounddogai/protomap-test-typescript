import { normalizeQueueNoticeCode } from "../../queue/queue-baseline/queue-notice-policy.js";
import { WeightedQueueRule } from "../../queue/queue-baseline/weighted-queue-rule.js";
import { PrimaryPostSnapshot, newPrimaryPostSnapshot } from "./primary-post-snapshot.js";

export function summarizeWeightedQueueRulesForSnapshot(items: WeightedQueueRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function derivePrimaryPostSnapshotsFromRule(items: WeightedQueueRule[]): PrimaryPostSnapshot[] {
  const out: PrimaryPostSnapshot[] = [];
  for (const item of items) {
    const derived = newPrimaryPostSnapshot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computePrimaryPostSnapshot(item: PrimaryPostSnapshot): string {
  return normalizeQueueNoticeCode(item.code);
}
