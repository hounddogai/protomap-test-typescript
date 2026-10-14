import { GlobalMacroOverride } from "../../macro/agreement/global-macro-override.js";
import { macroAgreementWeight } from "../../macro/agreement/macro-agreement-policy.js";
import { RegionalTicketViewRecord, newRegionalTicketViewRecord } from "./regional-ticket-view-record.js";

export function summarizeGlobalMacroOverridesForRecord(items: GlobalMacroOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveRegionalTicketViewRecordsFromOverride(items: GlobalMacroOverride[]): RegionalTicketViewRecord[] {
  const out: RegionalTicketViewRecord[] = [];
  for (const item of items) {
    const derived = newRegionalTicketViewRecord(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitRegionalTicketViewRecord(item: RegionalTicketViewRecord): number {
  return macroAgreementWeight(2, true);
}
