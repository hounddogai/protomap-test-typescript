import { normalizeAdaptiveModelAuditCode } from "../../model/adjustment/adaptive-model-audit-policy.js";
import { LenientModelAssignment } from "../../model/adjustment/lenient-model-assignment.js";
import { DefaultCreditLedger, newDefaultCreditLedger } from "./default-credit-ledger.js";

export function summarizeLenientModelAssignmentsForLedger(items: LenientModelAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveDefaultCreditLedgersFromAssignment(items: LenientModelAssignment[]): DefaultCreditLedger[] {
  const out: DefaultCreditLedger[] = [];
  for (const item of items) {
    const derived = newDefaultCreditLedger(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchDefaultCreditLedger(item: DefaultCreditLedger): string {
  return normalizeAdaptiveModelAuditCode(item.code);
}
