import { batchedWaitPolicyBucket } from "../../wait/wait-policy/batched-wait-policy-policy.js";
import { CappedWaitProfile } from "../../wait/wait-policy/capped-wait-profile.js";
import { StepRollup, newStepRollup } from "./step-rollup.js";

export function summarizeCappedWaitProfilesForRollup(items: CappedWaitProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveStepRollupsFromProfile(items: CappedWaitProfile[]): StepRollup[] {
  const out: StepRollup[] = [];
  for (const item of items) {
    const derived = newStepRollup(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeStepRollup(item: StepRollup): string {
  return batchedWaitPolicyBucket(item.netVolume());
}
