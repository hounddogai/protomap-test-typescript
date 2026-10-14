import { classifyManualProofTier } from "../../proof/proof-audit/manual-proof-tier-policy.js";
import { ProofPlan } from "../../proof/proof-audit/proof-plan.js";
import { TieredSubscriptionSchedule, newTieredSubscriptionSchedule } from "./tiered-subscription-schedule.js";

export function summarizeProofPlansForSchedule(items: ProofPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveTieredSubscriptionSchedulesFromPlan(items: ProofPlan[]): TieredSubscriptionSchedule[] {
  const out: TieredSubscriptionSchedule[] = [];
  for (const item of items) {
    const derived = newTieredSubscriptionSchedule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeTieredSubscriptionSchedule(item: TieredSubscriptionSchedule): string {
  return classifyManualProofTier(item.weightedExposure());
}
