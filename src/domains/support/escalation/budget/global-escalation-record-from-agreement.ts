import { tieredMacroAgreementWeight } from "../../macro/macro-policy/tiered-macro-agreement-policy.js";
import { TieredMacroAgreement } from "../../macro/macro-policy/tiered-macro-agreement.js";
import { GlobalEscalationRecord, newGlobalEscalationRecord } from "./global-escalation-record.js";

export function summarizeTieredMacroAgreementsForRecord(items: TieredMacroAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveGlobalEscalationRecordsFromAgreement(items: TieredMacroAgreement[]): GlobalEscalationRecord[] {
  const out: GlobalEscalationRecord[] = [];
  for (const item of items) {
    const derived = newGlobalEscalationRecord(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeGlobalEscalationRecord(item: GlobalEscalationRecord): number {
  return tieredMacroAgreementWeight(2, true);
}
