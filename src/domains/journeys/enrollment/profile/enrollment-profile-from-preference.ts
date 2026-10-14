import { normalizeBatchedBranchAgreementCode } from "../../branch/agreement/batched-branch-agreement-policy.js";
import { PrimaryBranchPreference } from "../../branch/agreement/primary-branch-preference.js";
import { EnrollmentProfile, newEnrollmentProfile } from "./enrollment-profile.js";

export function summarizePrimaryBranchPreferencesForProfile(items: PrimaryBranchPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveEnrollmentProfilesFromPreference(items: PrimaryBranchPreference[]): EnrollmentProfile[] {
  const out: EnrollmentProfile[] = [];
  for (const item of items) {
    const derived = newEnrollmentProfile(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeEnrollmentProfile(item: EnrollmentProfile): string {
  return normalizeBatchedBranchAgreementCode(item.code);
}
