import { AdaptiveApprovalAgreement } from "../mapping/adaptive-approval-agreement.js";
import { approvalSlotBucket } from "../mapping/approval-slot-policy.js";
import { ApprovalPreference, newApprovalPreference } from "./approval-preference.js";

export function summarizeAdaptiveApprovalAgreementsForPreference(items: AdaptiveApprovalAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveApprovalPreferencesFromAgreement(items: AdaptiveApprovalAgreement[]): ApprovalPreference[] {
  const out: ApprovalPreference[] = [];
  for (const item of items) {
    const derived = newApprovalPreference(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitApprovalPreference(item: ApprovalPreference): string {
  return approvalSlotBucket(item.effectiveLoad());
}
