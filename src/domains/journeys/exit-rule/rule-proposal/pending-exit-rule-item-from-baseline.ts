import { normalizeJourneyBaselineCode } from "../../journey/baseline/journey-baseline-policy.js";
import { JourneyBaseline } from "../../journey/baseline/journey-baseline.js";
import { PendingExitRuleItem, newPendingExitRuleItem } from "./pending-exit-rule-item.js";

export function summarizeJourneyBaselinesForItem(items: JourneyBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function derivePendingExitRuleItemsFromBaseline(items: JourneyBaseline[]): PendingExitRuleItem[] {
  const out: PendingExitRuleItem[] = [];
  for (const item of items) {
    const derived = newPendingExitRuleItem(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settlePendingExitRuleItem(item: PendingExitRuleItem): string {
  return normalizeJourneyBaselineCode(item.code);
}
