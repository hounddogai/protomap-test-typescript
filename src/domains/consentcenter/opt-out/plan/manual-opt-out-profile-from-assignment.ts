import { CappedOptOutAssignment } from "../assignment/capped-opt-out-assignment.js";
import { primaryOptOutClaimWeight } from "../assignment/primary-opt-out-claim-policy.js";
import { ManualOptOutProfile, newManualOptOutProfile } from "./manual-opt-out-profile.js";

export function summarizeCappedOptOutAssignmentsForProfile(items: CappedOptOutAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveManualOptOutProfilesFromAssignment(items: CappedOptOutAssignment[]): ManualOptOutProfile[] {
  const out: ManualOptOutProfile[] = [];
  for (const item of items) {
    const derived = newManualOptOutProfile(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveManualOptOutProfile(item: ManualOptOutProfile): number {
  return primaryOptOutClaimWeight(7, true);
}
