import { normalizeAdaptiveReplyBudgetCode } from "../../reply/variance/adaptive-reply-budget-policy.js";
import { ReplyAudit } from "../../reply/variance/reply-audit.js";
import { StrictQueueMetric, newStrictQueueMetric } from "./strict-queue-metric.js";

export function summarizeReplyAuditsForMetric(items: ReplyAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveStrictQueueMetricsFromAudit(items: ReplyAudit[]): StrictQueueMetric[] {
  const out: StrictQueueMetric[] = [];
  for (const item of items) {
    const derived = newStrictQueueMetric(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeStrictQueueMetric(item: StrictQueueMetric): string {
  return normalizeAdaptiveReplyBudgetCode(item.code);
}
