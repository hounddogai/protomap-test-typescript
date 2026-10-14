import { ReputationProfile } from "../../reputation/profile/reputation-profile.js";
import { DomainAssignment, newDomainAssignment } from "./domain-assignment.js";

export function summarizeReputationProfilesForAssignment(items: ReputationProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDomainAssignmentsFromProfile(items: ReputationProfile[]): DomainAssignment[] {
  const out: DomainAssignment[] = [];
  for (const item of items) {
    const derived = newDomainAssignment(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}
