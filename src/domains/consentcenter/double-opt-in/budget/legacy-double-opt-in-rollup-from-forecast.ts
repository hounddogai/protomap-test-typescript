import { ProofForecast } from "../../proof/forecast/proof-forecast.js";
import { normalizeProofMetricCode } from "../../proof/forecast/proof-metric-policy.js";
import { LegacyDoubleOptInRollup, newLegacyDoubleOptInRollup } from "./legacy-double-opt-in-rollup.js";

export function summarizeProofForecastsForRollup(items: ProofForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveLegacyDoubleOptInRollupsFromForecast(items: ProofForecast[]): LegacyDoubleOptInRollup[] {
  const out: LegacyDoubleOptInRollup[] = [];
  for (const item of items) {
    const derived = newLegacyDoubleOptInRollup(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankLegacyDoubleOptInRollup(item: LegacyDoubleOptInRollup): string {
  return normalizeProofMetricCode(item.code);
}
