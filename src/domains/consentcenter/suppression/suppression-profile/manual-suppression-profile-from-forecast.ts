import { OptOutForecast } from "../../opt-out/forecast/opt-out-forecast.js";
import { normalizeTieredOptOutWindowCode } from "../../opt-out/forecast/tiered-opt-out-window-policy.js";
import { ManualSuppressionProfile, newManualSuppressionProfile } from "./manual-suppression-profile.js";

export function summarizeOptOutForecastsForProfile(items: OptOutForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveManualSuppressionProfilesFromForecast(items: OptOutForecast[]): ManualSuppressionProfile[] {
  const out: ManualSuppressionProfile[] = [];
  for (const item of items) {
    const derived = newManualSuppressionProfile(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeManualSuppressionProfile(item: ManualSuppressionProfile): string {
  return normalizeTieredOptOutWindowCode(item.code);
}
