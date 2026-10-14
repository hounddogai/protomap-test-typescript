import { classifyRetentionBaseline } from "../../retention/adjustment/retention-baseline-policy.js";
import { RetentionBaseline } from "../../retention/adjustment/retention-baseline.js";
import { PaywallMetric, newPaywallMetric } from "./paywall-metric.js";

export function summarizeRetentionBaselinesForMetric(items: RetentionBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function derivePaywallMetricsFromBaseline(items: RetentionBaseline[]): PaywallMetric[] {
  const out: PaywallMetric[] = [];
  for (const item of items) {
    const derived = newPaywallMetric(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balancePaywallMetric(item: PaywallMetric): string {
  return classifyRetentionBaseline(item.netValue());
}
