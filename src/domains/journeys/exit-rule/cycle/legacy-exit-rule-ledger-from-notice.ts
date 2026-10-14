import { globalExitRuleNoticeWeight } from "../notice/global-exit-rule-notice-policy.js";
import { GlobalExitRuleNotice } from "../notice/global-exit-rule-notice.js";
import { LegacyExitRuleLedger, newLegacyExitRuleLedger } from "./legacy-exit-rule-ledger.js";

export function summarizeGlobalExitRuleNoticesForLedger(items: GlobalExitRuleNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveLegacyExitRuleLedgersFromNotice(items: GlobalExitRuleNotice[]): LegacyExitRuleLedger[] {
  const out: LegacyExitRuleLedger[] = [];
  for (const item of items) {
    const derived = newLegacyExitRuleLedger(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeLegacyExitRuleLedgerExtra(item: LegacyExitRuleLedger): number {
  return globalExitRuleNoticeWeight(4, true);
}
