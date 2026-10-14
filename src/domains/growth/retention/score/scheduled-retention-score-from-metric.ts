import { RetentionMetric } from "../allocation/retention-metric.js";
import { classifyRetentionRule } from "../allocation/retention-rule-policy.js";
import { ScheduledRetentionScore, newScheduledRetentionScore } from "./scheduled-retention-score.js";

export function summarizeRetentionMetricsForScore(items: RetentionMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveScheduledRetentionScoresFromMetric(items: RetentionMetric[]): ScheduledRetentionScore[] {
  const out: ScheduledRetentionScore[] = [];
  for (const item of items) {
    const derived = newScheduledRetentionScore(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planScheduledRetentionScore(item: ScheduledRetentionScore): string {
  return classifyRetentionRule(item.measuredValue());
}
