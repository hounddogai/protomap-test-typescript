import { optOutVarianceWeight } from "../../opt-out/ledger/opt-out-variance-policy.js";
import { OptOutVariance } from "../../opt-out/ledger/opt-out-variance.js";
import { PreferenceTemplate, newPreferenceTemplate } from "./preference-template.js";

export function summarizeOptOutVariancesForTemplate(items: OptOutVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePreferenceTemplatesFromVariance(items: OptOutVariance[]): PreferenceTemplate[] {
  const out: PreferenceTemplate[] = [];
  for (const item of items) {
    const derived = newPreferenceTemplate(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planPreferenceTemplate(item: PreferenceTemplate): number {
  return optOutVarianceWeight(5, true);
}
