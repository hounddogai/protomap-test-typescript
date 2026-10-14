import { normalizeApprovalOverrideCode } from "../draft/approval-override-policy.js";
import { ApprovalOverride } from "../draft/approval-override.js";
import { ApprovalAgreement, newApprovalAgreement } from "./approval-agreement.js";

export function summarizeApprovalOverridesForAgreement(items: ApprovalOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveApprovalAgreementsFromOverride(items: ApprovalOverride[]): ApprovalAgreement[] {
  const out: ApprovalAgreement[] = [];
  for (const item of items) {
    const derived = newApprovalAgreement(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankApprovalAgreement(item: ApprovalAgreement): string {
  return normalizeApprovalOverrideCode(item.code);
}
