import { AdaptiveFunnelBaseline } from "../../funnel/baseline/adaptive-funnel-baseline.js";
import { normalizeScheduledFunnelBundleCode } from "../../funnel/baseline/scheduled-funnel-bundle-policy.js";
import { GlobalCohortEntry, newGlobalCohortEntry } from "./global-cohort-entry.js";

export function summarizeAdaptiveFunnelBaselinesForEntry(items: AdaptiveFunnelBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveGlobalCohortEntriesFromBaseline(items: AdaptiveFunnelBaseline[]): GlobalCohortEntry[] {
  const out: GlobalCohortEntry[] = [];
  for (const item of items) {
    const derived = newGlobalCohortEntry(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignGlobalCohortEntry(item: GlobalCohortEntry): string {
  return normalizeScheduledFunnelBundleCode(item.code);
}
