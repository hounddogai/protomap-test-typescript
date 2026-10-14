import {
  classifyPrimaryApprovalAgreement,
} from "../../approval/approval-agreement/primary-approval-agreement-policy.js";
import { PrimaryApprovalAgreement } from "../../approval/approval-agreement/primary-approval-agreement.js";
import { MentionOverride, newMentionOverride } from "./mention-override.js";

export function summarizePrimaryApprovalAgreementsForOverride(items: PrimaryApprovalAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveMentionOverridesFromAgreement(items: PrimaryApprovalAgreement[]): MentionOverride[] {
  const out: MentionOverride[] = [];
  for (const item of items) {
    const derived = newMentionOverride(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planMentionOverride(item: MentionOverride): string {
  return classifyPrimaryApprovalAgreement(item.measuredValue());
}
