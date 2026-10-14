import { classifyScheduledSlaBaseline } from "../../sla/baseline/scheduled-sla-baseline-policy.js";
import { SlaSummary } from "../../sla/baseline/sla-summary.js";
import { AdaptiveCsatRequest, newAdaptiveCsatRequest } from "./adaptive-csat-request.js";

export function summarizeSlaSummariesForRequest(items: SlaSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveAdaptiveCsatRequestsFromSummary(items: SlaSummary[]): AdaptiveCsatRequest[] {
  const out: AdaptiveCsatRequest[] = [];
  for (const item of items) {
    const derived = newAdaptiveCsatRequest(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planAdaptiveCsatRequest(item: AdaptiveCsatRequest): string {
  return classifyScheduledSlaBaseline(item.measuredValue());
}
