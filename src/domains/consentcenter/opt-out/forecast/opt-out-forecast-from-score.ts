import { batchedOptOutScoreWeight } from "../out-score/batched-opt-out-score-policy.js";
import { BatchedOptOutScore } from "../out-score/batched-opt-out-score.js";
import { OptOutForecast, newOptOutForecast } from "./opt-out-forecast.js";

export function summarizeBatchedOptOutScoresForForecast(items: BatchedOptOutScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveOptOutForecastsFromScore(items: BatchedOptOutScore[]): OptOutForecast[] {
  const out: OptOutForecast[] = [];
  for (const item of items) {
    const derived = newOptOutForecast(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planOptOutForecast(item: OptOutForecast): number {
  return batchedOptOutScoreWeight(6, true);
}
