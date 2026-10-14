import { regionalApprovalAgreementBucket } from "../../approval/approval-quota/regional-approval-agreement-policy.js";
import { RegionalApprovalAgreement } from "../../approval/approval-quota/regional-approval-agreement.js";
import { DefaultMentionOverride, newDefaultMentionOverride } from "./default-mention-override.js";

export function summarizeRegionalApprovalAgreementsForOverride(items: RegionalApprovalAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveDefaultMentionOverridesFromAgreement(items: RegionalApprovalAgreement[]): DefaultMentionOverride[] {
  const out: DefaultMentionOverride[] = [];
  for (const item of items) {
    const derived = newDefaultMentionOverride(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeDefaultMentionOverride(item: DefaultMentionOverride): string {
  return regionalApprovalAgreementBucket(item.weightedLoad());
}
