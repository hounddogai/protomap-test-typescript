import { classifyCohortTemplate } from "../../cohort/template/cohort-template-policy.js";
import { TieredCohortLedger } from "../../cohort/template/tiered-cohort-ledger.js";
import { FunnelNotice, newFunnelNotice } from "./funnel-notice.js";

export function summarizeTieredCohortLedgersForNotice(items: TieredCohortLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveFunnelNoticesFromLedger(items: TieredCohortLedger[]): FunnelNotice[] {
  const out: FunnelNotice[] = [];
  for (const item of items) {
    const derived = newFunnelNotice(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeFunnelNotice(item: FunnelNotice): string {
  return classifyCohortTemplate(item.effectiveVolume());
}
