import { AdaptiveMentionAllocation } from "../../mention/mention-digest/adaptive-mention-allocation.js";
import { normalizeDefaultMentionMappingCode } from "../../mention/mention-digest/default-mention-mapping-policy.js";
import { PrimaryApprovalAgreement, newPrimaryApprovalAgreement } from "./primary-approval-agreement.js";

export function summarizeAdaptiveMentionAllocationsForAgreement(items: AdaptiveMentionAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function derivePrimaryApprovalAgreementsFromAllocation(items: AdaptiveMentionAllocation[]): PrimaryApprovalAgreement[] {
  const out: PrimaryApprovalAgreement[] = [];
  for (const item of items) {
    const derived = newPrimaryApprovalAgreement(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function allocatePrimaryApprovalAgreement(item: PrimaryApprovalAgreement): string {
  return normalizeDefaultMentionMappingCode(item.code);
}
