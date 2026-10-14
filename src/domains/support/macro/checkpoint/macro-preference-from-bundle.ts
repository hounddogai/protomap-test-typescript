import { SlaBundle } from "../../sla/rollup/sla-bundle.js";
import { slaMilestoneBucket } from "../../sla/rollup/sla-milestone-policy.js";
import { MacroPreference, newMacroPreference } from "./macro-preference.js";

export function summarizeSlaBundlesForPreference(items: SlaBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveMacroPreferencesFromBundle(items: SlaBundle[]): MacroPreference[] {
  const out: MacroPreference[] = [];
  for (const item of items) {
    const derived = newMacroPreference(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchMacroPreference(item: MacroPreference): string {
  return slaMilestoneBucket(item.netLoad());
}
