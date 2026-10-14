import { ApprovalPolicy } from "../../approval/policy/approval-policy.js";
import { normalizeStrictApprovalScoreCode } from "../../approval/policy/strict-approval-score-policy.js";
import { AdaptiveQueueTemplate, newAdaptiveQueueTemplate } from "./adaptive-queue-template.js";

export function summarizeApprovalPoliciesForTemplate(items: ApprovalPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveAdaptiveQueueTemplatesFromPolicy(items: ApprovalPolicy[]): AdaptiveQueueTemplate[] {
  const out: AdaptiveQueueTemplate[] = [];
  for (const item of items) {
    const derived = newAdaptiveQueueTemplate(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeAdaptiveQueueTemplate(item: AdaptiveQueueTemplate): string {
  return normalizeStrictApprovalScoreCode(item.code);
}
