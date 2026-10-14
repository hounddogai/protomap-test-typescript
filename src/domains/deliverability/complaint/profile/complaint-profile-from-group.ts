import { AdaptiveComplaintGroup } from "../complaint-target/adaptive-complaint-group.js";
import { adaptiveComplaintLedgerWeight } from "../complaint-target/adaptive-complaint-ledger-policy.js";
import { ComplaintProfile, newComplaintProfile } from "./complaint-profile.js";

export function summarizeAdaptiveComplaintGroupsForProfile(items: AdaptiveComplaintGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveComplaintProfilesFromGroup(items: AdaptiveComplaintGroup[]): ComplaintProfile[] {
  const out: ComplaintProfile[] = [];
  for (const item of items) {
    const derived = newComplaintProfile(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeComplaintProfile(item: ComplaintProfile): number {
  return adaptiveComplaintLedgerWeight(2, true);
}
