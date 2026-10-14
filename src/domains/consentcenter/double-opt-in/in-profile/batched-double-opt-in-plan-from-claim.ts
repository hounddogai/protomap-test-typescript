import { normalizeGlobalProofSlotCode } from "../../proof/slot/global-proof-slot-policy.js";
import { SeasonalProofClaim } from "../../proof/slot/seasonal-proof-claim.js";
import { BatchedDoubleOptInPlan, newBatchedDoubleOptInPlan } from "./batched-double-opt-in-plan.js";

export function summarizeSeasonalProofClaimsForPlan(items: SeasonalProofClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveBatchedDoubleOptInPlansFromClaim(items: SeasonalProofClaim[]): BatchedDoubleOptInPlan[] {
  const out: BatchedDoubleOptInPlan[] = [];
  for (const item of items) {
    const derived = newBatchedDoubleOptInPlan(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeBatchedDoubleOptInPlan(item: BatchedDoubleOptInPlan): string {
  return normalizeGlobalProofSlotCode(item.code);
}
