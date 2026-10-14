import { BatchedWaitRule } from "../entry/batched-wait-rule.js";
import { waitEntryBucket } from "../entry/wait-entry-policy.js";
import { ManualWaitTarget, newManualWaitTarget } from "./manual-wait-target.js";

export function summarizeBatchedWaitRulesForTarget(items: BatchedWaitRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveManualWaitTargetsFromRule(items: BatchedWaitRule[]): ManualWaitTarget[] {
  const out: ManualWaitTarget[] = [];
  for (const item of items) {
    const derived = newManualWaitTarget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateManualWaitTarget(item: ManualWaitTarget): string {
  return waitEntryBucket(item.measuredValue());
}
