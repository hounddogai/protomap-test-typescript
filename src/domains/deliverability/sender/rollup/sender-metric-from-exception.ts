import { classifyReputationException } from "../../reputation/exception/reputation-exception-policy.js";
import { ReputationException } from "../../reputation/exception/reputation-exception.js";
import { SenderMetric, newSenderMetric } from "./sender-metric.js";

export function summarizeReputationExceptionsForMetric(items: ReputationException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveSenderMetricsFromException(items: ReputationException[]): SenderMetric[] {
  const out: SenderMetric[] = [];
  for (const item of items) {
    const derived = newSenderMetric(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignSenderMetric(item: SenderMetric): string {
  return classifyReputationException(item.weightedVolume());
}
