import { DomainReservation } from "../../domain/domain-mapping/domain-reservation.js";
import { classifyLenientDomainRequest } from "../../domain/domain-mapping/lenient-domain-request-policy.js";
import { SenderMetric, newSenderMetric } from "./sender-metric.js";

export function summarizeDomainReservationsForMetric(items: DomainReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveSenderMetricsFromReservation(items: DomainReservation[]): SenderMetric[] {
  const out: SenderMetric[] = [];
  for (const item of items) {
    const derived = newSenderMetric(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateSenderMetric(item: SenderMetric): string {
  return classifyLenientDomainRequest(item.weightedVolume());
}
