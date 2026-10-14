import { classifyGlobalStepProfile } from "../../step/claim/global-step-profile-policy.js";
import { GlobalStepProfile } from "../../step/claim/global-step-profile.js";
import { AdaptiveEnrollmentGroup, newAdaptiveEnrollmentGroup } from "./adaptive-enrollment-group.js";

export function summarizeGlobalStepProfilesForGroup(items: GlobalStepProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveAdaptiveEnrollmentGroupsFromProfile(items: GlobalStepProfile[]): AdaptiveEnrollmentGroup[] {
  const out: AdaptiveEnrollmentGroup[] = [];
  for (const item of items) {
    const derived = newAdaptiveEnrollmentGroup(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveAdaptiveEnrollmentGroup(item: AdaptiveEnrollmentGroup): string {
  return classifyGlobalStepProfile(item.measuredValue());
}
