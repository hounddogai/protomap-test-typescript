import { scheduledMacroSummaryWeight } from "../../macro/macro-claim/scheduled-macro-summary-policy.js";
import { ScheduledMacroSummary } from "../../macro/macro-claim/scheduled-macro-summary.js";
import { ManualEscalationLedger, newManualEscalationLedger } from "./manual-escalation-ledger.js";

export function summarizeScheduledMacroSummariesForLedger(items: ScheduledMacroSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveManualEscalationLedgersFromSummary(items: ScheduledMacroSummary[]): ManualEscalationLedger[] {
  const out: ManualEscalationLedger[] = [];
  for (const item of items) {
    const derived = newManualEscalationLedger(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateManualEscalationLedger(item: ManualEscalationLedger): number {
  return scheduledMacroSummaryWeight(9, true);
}
