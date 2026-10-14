import { normalizeBatchedSenderBatchCode } from "../../sender/rule/batched-sender-batch-policy.js";
import { ScheduledSenderClaim } from "../../sender/rule/scheduled-sender-claim.js";
import { ReputationForecast, newReputationForecast } from "./reputation-forecast.js";

export function summarizeScheduledSenderClaimsForForecast(items: ScheduledSenderClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveReputationForecastsFromClaim(items: ScheduledSenderClaim[]): ReputationForecast[] {
  const out: ReputationForecast[] = [];
  for (const item of items) {
    const derived = newReputationForecast(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyReputationForecast(item: ReputationForecast): string {
  return normalizeBatchedSenderBatchCode(item.code);
}
