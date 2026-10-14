import { classifyRollingJourneyAgreement } from "../../journey/journey-rollup/rolling-journey-agreement-policy.js";
import { RollingJourneyAgreement } from "../../journey/journey-rollup/rolling-journey-agreement.js";
import { GlobalExitRuleEntry, newGlobalExitRuleEntry } from "./global-exit-rule-entry.js";

export function summarizeRollingJourneyAgreementsForEntry(items: RollingJourneyAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveGlobalExitRuleEntriesFromAgreement(items: RollingJourneyAgreement[]): GlobalExitRuleEntry[] {
  const out: GlobalExitRuleEntry[] = [];
  for (const item of items) {
    const derived = newGlobalExitRuleEntry(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectGlobalExitRuleEntry(item: GlobalExitRuleEntry): string {
  return classifyRollingJourneyAgreement(item.weightedLoad());
}
