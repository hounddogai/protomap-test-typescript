import { manualOptOutQuotaBucket } from "../../opt-out/out-quota/manual-opt-out-quota-policy.js";
import { SeasonalOptOutRule } from "../../opt-out/out-quota/seasonal-opt-out-rule.js";
import { DefaultPreferenceNotice, newDefaultPreferenceNotice } from "./default-preference-notice.js";

export function summarizeSeasonalOptOutRulesForNotice(items: SeasonalOptOutRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveDefaultPreferenceNoticesFromRule(items: SeasonalOptOutRule[]): DefaultPreferenceNotice[] {
  const out: DefaultPreferenceNotice[] = [];
  for (const item of items) {
    const derived = newDefaultPreferenceNotice(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitDefaultPreferenceNotice(item: DefaultPreferenceNotice): string {
  return manualOptOutQuotaBucket(item.effectiveExposure());
}
