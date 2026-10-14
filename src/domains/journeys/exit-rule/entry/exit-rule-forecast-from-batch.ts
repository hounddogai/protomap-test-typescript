import { waitBatchBucket } from "../../wait/batch/wait-batch-policy.js";
import { WaitBatch } from "../../wait/batch/wait-batch.js";
import { ExitRuleForecast, newExitRuleForecast } from "./exit-rule-forecast.js";

export function summarizeWaitBatchesForForecast(items: WaitBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveExitRuleForecastsFromBatch(items: WaitBatch[]): ExitRuleForecast[] {
  const out: ExitRuleForecast[] = [];
  for (const item of items) {
    const derived = newExitRuleForecast(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitExitRuleForecast(item: ExitRuleForecast): string {
  return waitBatchBucket(item.measuredValue());
}
