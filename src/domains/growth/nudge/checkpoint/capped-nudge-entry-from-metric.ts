import {
  normalizeLenientPaywallMetricCode,
} from "../../paywall/legacy-paywall-metric/lenient-paywall-metric-policy.js";
import { LenientPaywallMetric } from "../../paywall/legacy-paywall-metric/lenient-paywall-metric.js";
import { CappedNudgeEntry, newCappedNudgeEntry } from "./capped-nudge-entry.js";

export function summarizeLenientPaywallMetricsForEntry(items: LenientPaywallMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveCappedNudgeEntriesFromMetric(items: LenientPaywallMetric[]): CappedNudgeEntry[] {
  const out: CappedNudgeEntry[] = [];
  for (const item of items) {
    const derived = newCappedNudgeEntry(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveCappedNudgeEntry(item: CappedNudgeEntry): string {
  return normalizeLenientPaywallMetricCode(item.code);
}
