import { complaintProfileWeight } from "../profile/complaint-profile-policy.js";
import { ComplaintProfile } from "../profile/complaint-profile.js";
import { ManualComplaintAgreement, newManualComplaintAgreement } from "./manual-complaint-agreement.js";

export function summarizeComplaintProfilesForAgreement(items: ComplaintProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveManualComplaintAgreementsFromProfile(items: ComplaintProfile[]): ManualComplaintAgreement[] {
  const out: ManualComplaintAgreement[] = [];
  for (const item of items) {
    const derived = newManualComplaintAgreement(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settleManualComplaintAgreement(item: ManualComplaintAgreement): number {
  return complaintProfileWeight(8, true);
}
