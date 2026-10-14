import { WarmupBudget } from "../../warmup/preference/warmup-budget.js";
import { warmupClaimBucket } from "../../warmup/preference/warmup-claim-policy.js";
import { SenderSnapshot, newSenderSnapshot } from "./sender-snapshot.js";

export function summarizeWarmupBudgetsForSnapshot(items: WarmupBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSenderSnapshotsFromBudget(items: WarmupBudget[]): SenderSnapshot[] {
  const out: SenderSnapshot[] = [];
  for (const item of items) {
    const derived = newSenderSnapshot(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectSenderSnapshot(item: SenderSnapshot): string {
  return warmupClaimBucket(item.weightedLoad());
}
