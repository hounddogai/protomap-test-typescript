import { AdaptiveExitRuleProfile } from "../../exit-rule/rule-proposal/adaptive-exit-rule-profile.js";
import { classifyPendingExitRuleItem } from "../../exit-rule/rule-proposal/pending-exit-rule-item-policy.js";
import { ScheduledWaitBundle, newScheduledWaitBundle } from "./scheduled-wait-bundle.js";

export function summarizeAdaptiveExitRuleProfilesForBundle(items: AdaptiveExitRuleProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveScheduledWaitBundlesFromProfile(items: AdaptiveExitRuleProfile[]): ScheduledWaitBundle[] {
  const out: ScheduledWaitBundle[] = [];
  for (const item of items) {
    const derived = newScheduledWaitBundle(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyScheduledWaitBundle(item: ScheduledWaitBundle): string {
  return classifyPendingExitRuleItem(item.measuredValue());
}
