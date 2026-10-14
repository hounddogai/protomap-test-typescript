import { exitRulePreferenceWeight } from "../../exit-rule/metric/exit-rule-preference-policy.js";
import { ExitRulePreference } from "../../exit-rule/metric/exit-rule-preference.js";
import { TieredWaitManifest, newTieredWaitManifest } from "./tiered-wait-manifest.js";

export function summarizeExitRulePreferencesForManifest(items: ExitRulePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveTieredWaitManifestsFromPreference(items: ExitRulePreference[]): TieredWaitManifest[] {
  const out: TieredWaitManifest[] = [];
  for (const item of items) {
    const derived = newTieredWaitManifest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateTieredWaitManifest(item: TieredWaitManifest): number {
  return exitRulePreferenceWeight(1, true);
}
