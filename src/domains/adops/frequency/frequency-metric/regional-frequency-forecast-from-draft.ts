import { CappedFrequencyDraft } from "../exception/capped-frequency-draft.js";
import { normalizeWeightedFrequencyExceptionCode } from "../exception/weighted-frequency-exception-policy.js";
import { RegionalFrequencyForecast, newRegionalFrequencyForecast } from "./regional-frequency-forecast.js";

export function summarizeCappedFrequencyDraftsForForecast(items: CappedFrequencyDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveRegionalFrequencyForecastsFromDraft(items: CappedFrequencyDraft[]): RegionalFrequencyForecast[] {
  const out: RegionalFrequencyForecast[] = [];
  for (const item of items) {
    const derived = newRegionalFrequencyForecast(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeRegionalFrequencyForecast(item: RegionalFrequencyForecast): string {
  return normalizeWeightedFrequencyExceptionCode(item.code);
}
