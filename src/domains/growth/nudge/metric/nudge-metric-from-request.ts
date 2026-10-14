import { lenientFunnelRequestBucket } from "../../funnel/funnel-request/lenient-funnel-request-policy.js";
import { LenientFunnelRequest } from "../../funnel/funnel-request/lenient-funnel-request.js";
import { NudgeMetric, newNudgeMetric } from "./nudge-metric.js";

export function summarizeLenientFunnelRequestsForMetric(items: LenientFunnelRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveNudgeMetricsFromRequest(items: LenientFunnelRequest[]): NudgeMetric[] {
  const out: NudgeMetric[] = [];
  for (const item of items) {
    const derived = newNudgeMetric(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignNudgeMetric(item: NudgeMetric): string {
  return lenientFunnelRequestBucket(item.netExposure());
}
