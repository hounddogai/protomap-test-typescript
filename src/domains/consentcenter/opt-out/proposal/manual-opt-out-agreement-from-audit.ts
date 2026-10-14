import { classifyDefaultProofRule } from "../../proof/summary/default-proof-rule-policy.js";
import { PendingProofAudit } from "../../proof/summary/pending-proof-audit.js";
import { ManualOptOutAgreement, newManualOptOutAgreement } from "./manual-opt-out-agreement.js";

export function summarizePendingProofAuditsForAgreement(items: PendingProofAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveManualOptOutAgreementsFromAudit(items: PendingProofAudit[]): ManualOptOutAgreement[] {
  const out: ManualOptOutAgreement[] = [];
  for (const item of items) {
    const derived = newManualOptOutAgreement(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeManualOptOutAgreement(item: ManualOptOutAgreement): string {
  return classifyDefaultProofRule(item.projectedLoad());
}
