import { ProofBatch } from "../../proof/cycle/proof-batch.js";
import { classifyProofMapping } from "../../proof/cycle/proof-mapping-policy.js";
import { PreferenceForecast, newPreferenceForecast } from "./preference-forecast.js";

export function summarizeProofBatchesForForecast(items: ProofBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function derivePreferenceForecastsFromBatch(items: ProofBatch[]): PreferenceForecast[] {
  const out: PreferenceForecast[] = [];
  for (const item of items) {
    const derived = newPreferenceForecast(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignPreferenceForecast(item: PreferenceForecast): string {
  return classifyProofMapping(item.weightedVolume());
}
