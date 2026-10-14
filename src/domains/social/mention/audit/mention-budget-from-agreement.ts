import { ApprovalAgreement } from "../../approval/agreement/approval-agreement.js";
import { pendingApprovalBundleWeight } from "../../approval/agreement/pending-approval-bundle-policy.js";
import { MentionBudget, newMentionBudget } from "./mention-budget.js";

export function summarizeApprovalAgreementsForBudget(items: ApprovalAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveMentionBudgetsFromAgreement(items: ApprovalAgreement[]): MentionBudget[] {
  const out: MentionBudget[] = [];
  for (const item of items) {
    const derived = newMentionBudget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeMentionBudget(item: MentionBudget): number {
  return pendingApprovalBundleWeight(1, true);
}
