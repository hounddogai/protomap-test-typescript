import { EscalationAgreement } from "../../escalation/agreement/escalation-agreement.js";
import { manualEscalationScheduleBucket } from "../../escalation/agreement/manual-escalation-schedule-policy.js";
import { MacroAudit, newMacroAudit } from "./macro-audit.js";

export function summarizeEscalationAgreementsForAudit(items: EscalationAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveMacroAuditsFromAgreement(items: EscalationAgreement[]): MacroAudit[] {
  const out: MacroAudit[] = [];
  for (const item of items) {
    const derived = newMacroAudit(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileMacroAudit(item: MacroAudit): string {
  return manualEscalationScheduleBucket(item.measuredValue());
}
