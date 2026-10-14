import {
  batchedActivationBatchBucket,
} from "../../activation/strict-activation-window/batched-activation-batch-policy.js";
import { StrictActivationManifest } from "../../activation/strict-activation-window/strict-activation-manifest.js";
import { GlobalNudgeForecast, newGlobalNudgeForecast } from "./global-nudge-forecast.js";

export function summarizeStrictActivationManifestsForForecast(items: StrictActivationManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveGlobalNudgeForecastsFromManifest(items: StrictActivationManifest[]): GlobalNudgeForecast[] {
  const out: GlobalNudgeForecast[] = [];
  for (const item of items) {
    const derived = newGlobalNudgeForecast(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planGlobalNudgeForecast(item: GlobalNudgeForecast): string {
  return batchedActivationBatchBucket(item.adjustedExposure());
}
