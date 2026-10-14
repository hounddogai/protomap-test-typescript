import { ExitRuleItem } from "../../exit-rule/ledger/exit-rule-item.js";
import { exitRuleLedgerWeight } from "../../exit-rule/ledger/exit-rule-ledger-policy.js";
import { JourneyPreference, newJourneyPreference } from "./journey-preference.js";

export function summarizeExitRuleItemsForPreference(items: ExitRuleItem[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveJourneyPreferencesFromItem(items: ExitRuleItem[]): JourneyPreference[] {
  const out: JourneyPreference[] = [];
  for (const item of items) {
    const derived = newJourneyPreference(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceJourneyPreference(item: JourneyPreference): number {
  return exitRuleLedgerWeight(7, true);
}
