import { classifyDefaultSenderRollup } from "../../sender/snapshot/default-sender-rollup-policy.js";
import { DefaultSenderRollup } from "../../sender/snapshot/default-sender-rollup.js";
import { DomainMetric, newDomainMetric } from "./domain-metric.js";

export function summarizeDefaultSenderRollupsForMetric(items: DefaultSenderRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveDomainMetricsFromRollup(items: DefaultSenderRollup[]): DomainMetric[] {
  const out: DomainMetric[] = [];
  for (const item of items) {
    const derived = newDomainMetric(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileDomainMetric(item: DomainMetric): string {
  return classifyDefaultSenderRollup(item.effectiveExposure());
}
