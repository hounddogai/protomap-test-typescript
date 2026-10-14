import { QueueForecast } from "../../queue/baseline/queue-forecast.js";
import { queueOverrideBucket } from "../../queue/baseline/queue-override-policy.js";
import { ReplyTier, newReplyTier } from "./reply-tier.js";

export function summarizeQueueForecastsForTier(items: QueueForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveReplyTiersFromForecast(items: QueueForecast[]): ReplyTier[] {
  const out: ReplyTier[] = [];
  for (const item of items) {
    const derived = newReplyTier(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceReplyTier(item: ReplyTier): string {
  return queueOverrideBucket(item.effectiveValue());
}
