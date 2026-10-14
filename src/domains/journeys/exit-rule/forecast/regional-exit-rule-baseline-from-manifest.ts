import { globalBranchCycleBucket } from "../../branch/seasonal-branch-cycle/global-branch-cycle-policy.js";
import { StrictBranchManifest } from "../../branch/seasonal-branch-cycle/strict-branch-manifest.js";
import { RegionalExitRuleBaseline, newRegionalExitRuleBaseline } from "./regional-exit-rule-baseline.js";

export function summarizeStrictBranchManifestsForBaseline(items: StrictBranchManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveRegionalExitRuleBaselinesFromManifest(items: StrictBranchManifest[]): RegionalExitRuleBaseline[] {
  const out: RegionalExitRuleBaseline[] = [];
  for (const item of items) {
    const derived = newRegionalExitRuleBaseline(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignRegionalExitRuleBaseline(item: RegionalExitRuleBaseline): string {
  return globalBranchCycleBucket(item.adjustedValue());
}
