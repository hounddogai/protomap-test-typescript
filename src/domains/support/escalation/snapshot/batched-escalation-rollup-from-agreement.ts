import { normalizeBatchedSlaAgreementCode } from "../../sla/digest/batched-sla-agreement-policy.js";
import { BatchedSlaAgreement } from "../../sla/digest/batched-sla-agreement.js";
import { BatchedEscalationRollup, newBatchedEscalationRollup } from "./batched-escalation-rollup.js";

export function summarizeBatchedSlaAgreementsForRollup(items: BatchedSlaAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveBatchedEscalationRollupsFromAgreement(items: BatchedSlaAgreement[]): BatchedEscalationRollup[] {
  const out: BatchedEscalationRollup[] = [];
  for (const item of items) {
    const derived = newBatchedEscalationRollup(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveBatchedEscalationRollup(item: BatchedEscalationRollup): string {
  return normalizeBatchedSlaAgreementCode(item.code);
}
