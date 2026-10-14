import {
  classifySeasonalDoubleOptInAudit,
} from "../../double-opt-in/in-budget/seasonal-double-opt-in-audit-policy.js";
import { TieredDoubleOptInPlan } from "../../double-opt-in/in-budget/tiered-double-opt-in-plan.js";
import { PendingSubscriptionManifest, newPendingSubscriptionManifest } from "./pending-subscription-manifest.js";

export function summarizeTieredDoubleOptInPlansForManifest(items: TieredDoubleOptInPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function derivePendingSubscriptionManifestsFromPlan(items: TieredDoubleOptInPlan[]): PendingSubscriptionManifest[] {
  const out: PendingSubscriptionManifest[] = [];
  for (const item of items) {
    const derived = newPendingSubscriptionManifest(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcilePendingSubscriptionManifest(item: PendingSubscriptionManifest): string {
  return classifySeasonalDoubleOptInAudit(item.weightedTotal());
}
