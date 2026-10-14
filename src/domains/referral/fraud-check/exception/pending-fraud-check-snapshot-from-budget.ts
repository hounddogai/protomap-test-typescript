import { defaultFraudCheckBundleWeight } from "../checkpoint/default-fraud-check-bundle-policy.js";
import { FraudCheckBudget } from "../checkpoint/fraud-check-budget.js";
import { PendingFraudCheckSnapshot, newPendingFraudCheckSnapshot } from "./pending-fraud-check-snapshot.js";

export function summarizeFraudCheckBudgetsForSnapshot(items: FraudCheckBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function derivePendingFraudCheckSnapshotsFromBudget(items: FraudCheckBudget[]): PendingFraudCheckSnapshot[] {
  const out: PendingFraudCheckSnapshot[] = [];
  for (const item of items) {
    const derived = newPendingFraudCheckSnapshot(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcilePendingFraudCheckSnapshot(item: PendingFraudCheckSnapshot): number {
  return defaultFraudCheckBundleWeight(6, true);
}
