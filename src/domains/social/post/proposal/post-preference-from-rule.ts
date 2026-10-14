import { approvalQuotaWeight } from "../../approval/quota/approval-quota-policy.js";
import { ApprovalRule } from "../../approval/quota/approval-rule.js";
import { PostPreference, newPostPreference } from "./post-preference.js";

export function summarizeApprovalRulesForPreference(items: ApprovalRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function derivePostPreferencesFromRule(items: ApprovalRule[]): PostPreference[] {
  const out: PostPreference[] = [];
  for (const item of items) {
    const derived = newPostPreference(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planPostPreference(item: PostPreference): number {
  return approvalQuotaWeight(8, true);
}
