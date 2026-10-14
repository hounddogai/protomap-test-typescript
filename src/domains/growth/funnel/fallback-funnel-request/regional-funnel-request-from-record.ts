import { normalizeFunnelRollupCode } from "../rollup/funnel-rollup-policy.js";
import { PrimaryFunnelRecord } from "../rollup/primary-funnel-record.js";
import { RegionalFunnelRequest, newRegionalFunnelRequest } from "./regional-funnel-request.js";

export function summarizePrimaryFunnelRecordsForRequest(items: PrimaryFunnelRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveRegionalFunnelRequestsFromRecord(items: PrimaryFunnelRecord[]): RegionalFunnelRequest[] {
  const out: RegionalFunnelRequest[] = [];
  for (const item of items) {
    const derived = newRegionalFunnelRequest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreRegionalFunnelRequest(item: RegionalFunnelRequest): string {
  return normalizeFunnelRollupCode(item.code);
}
