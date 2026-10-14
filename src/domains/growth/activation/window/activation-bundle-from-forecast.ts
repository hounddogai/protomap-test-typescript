import { RetentionForecast } from "../../retention/audit/retention-forecast.js";
import { retentionQuotaBucket } from "../../retention/audit/retention-quota-policy.js";
import { ActivationBundle, newActivationBundle } from "./activation-bundle.js";

export function summarizeRetentionForecastsForBundle(items: RetentionForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveActivationBundlesFromForecast(items: RetentionForecast[]): ActivationBundle[] {
  const out: ActivationBundle[] = [];
  for (const item of items) {
    const derived = newActivationBundle(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitActivationBundle(item: ActivationBundle): string {
  return retentionQuotaBucket(item.weightedExposure());
}
