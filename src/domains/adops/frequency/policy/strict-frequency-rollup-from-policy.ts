import { classifyRollingFrequencyLedger } from "../ledger/rolling-frequency-ledger-policy.js";
import { SeasonalFrequencyPolicy } from "../ledger/seasonal-frequency-policy.js";
import { StrictFrequencyRollup, newStrictFrequencyRollup } from "./strict-frequency-rollup.js";

export function summarizeSeasonalFrequencyPoliciesForRollup(items: SeasonalFrequencyPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveStrictFrequencyRollupsFromPolicy(items: SeasonalFrequencyPolicy[]): StrictFrequencyRollup[] {
  const out: StrictFrequencyRollup[] = [];
  for (const item of items) {
    const derived = newStrictFrequencyRollup(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveStrictFrequencyRollup(item: StrictFrequencyRollup): string {
  return classifyRollingFrequencyLedger(item.netValue());
}
