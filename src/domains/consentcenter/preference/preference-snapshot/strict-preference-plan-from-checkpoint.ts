import { PrimaryProofCheckpoint } from "../../proof/rolling-proof-checkpoint/primary-proof-checkpoint.js";
import { proofClaimBucket } from "../../proof/rolling-proof-checkpoint/proof-claim-policy.js";
import { StrictPreferencePlan, newStrictPreferencePlan } from "./strict-preference-plan.js";

export function summarizePrimaryProofCheckpointsForPlan(items: PrimaryProofCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveStrictPreferencePlansFromCheckpoint(items: PrimaryProofCheckpoint[]): StrictPreferencePlan[] {
  const out: StrictPreferencePlan[] = [];
  for (const item of items) {
    const derived = newStrictPreferencePlan(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeStrictPreferencePlan(item: StrictPreferencePlan): string {
  return proofClaimBucket(item.weightedTotal());
}
