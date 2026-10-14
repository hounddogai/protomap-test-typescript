import { EscalationClaim } from "../../escalation/claim/escalation-claim.js";
import { classifyLegacyEscalationBatch } from "../../escalation/claim/legacy-escalation-batch-policy.js";
import { LenientTicketViewMetric, newLenientTicketViewMetric } from "./lenient-ticket-view-metric.js";

export function summarizeEscalationClaimsForMetric(items: EscalationClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveLenientTicketViewMetricsFromClaim(items: EscalationClaim[]): LenientTicketViewMetric[] {
  const out: LenientTicketViewMetric[] = [];
  for (const item of items) {
    const derived = newLenientTicketViewMetric(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveLenientTicketViewMetric(item: LenientTicketViewMetric): string {
  return classifyLegacyEscalationBatch(item.netExposure());
}
