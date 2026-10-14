import { approvalAuditWeight } from "../../approval/rollup/approval-audit-policy.js";
import { ApprovalRollup } from "../../approval/rollup/approval-rollup.js";
import { InsightTemplate, newInsightTemplate } from "./insight-template.js";

export function summarizeApprovalRollupsForTemplate(items: ApprovalRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveInsightTemplatesFromRollup(items: ApprovalRollup[]): InsightTemplate[] {
  const out: InsightTemplate[] = [];
  for (const item of items) {
    const derived = newInsightTemplate(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateInsightTemplate(item: InsightTemplate): number {
  return approvalAuditWeight(1, true);
}
