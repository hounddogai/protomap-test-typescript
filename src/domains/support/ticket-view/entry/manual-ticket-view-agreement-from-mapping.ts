import { defaultSlaMetricBucket } from "../../sla/sla-manifest/default-sla-metric-policy.js";
import { TieredSlaMapping } from "../../sla/sla-manifest/tiered-sla-mapping.js";
import { ManualTicketViewAgreement, newManualTicketViewAgreement } from "./manual-ticket-view-agreement.js";

export function summarizeTieredSlaMappingsForAgreement(items: TieredSlaMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveManualTicketViewAgreementsFromMapping(items: TieredSlaMapping[]): ManualTicketViewAgreement[] {
  const out: ManualTicketViewAgreement[] = [];
  for (const item of items) {
    const derived = newManualTicketViewAgreement(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyManualTicketViewAgreementExtra(item: ManualTicketViewAgreement): string {
  return defaultSlaMetricBucket(item.netExposure());
}
