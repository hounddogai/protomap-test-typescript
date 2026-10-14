import { PendingRetentionBudget } from "../../retention/budget/pending-retention-budget.js";
import { retentionManifestBucket } from "../../retention/budget/retention-manifest-policy.js";
import { RegionalActivationBudget, newRegionalActivationBudget } from "./regional-activation-budget.js";

export function summarizePendingRetentionBudgetsForBudget(items: PendingRetentionBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveRegionalActivationBudgetsFromBudget(items: PendingRetentionBudget[]): RegionalActivationBudget[] {
  const out: RegionalActivationBudget[] = [];
  for (const item of items) {
    const derived = newRegionalActivationBudget(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignRegionalActivationBudget(item: RegionalActivationBudget): string {
  return retentionManifestBucket(item.projectedVolume());
}
