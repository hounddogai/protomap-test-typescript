import { DomainWindow } from "../../domain/snapshot/domain-window.js";
import { normalizeSeasonalDomainVarianceCode } from "../../domain/snapshot/seasonal-domain-variance-policy.js";
import { FallbackReputationSnapshot, newFallbackReputationSnapshot } from "./fallback-reputation-snapshot.js";

export function summarizeDomainWindowsForSnapshot(items: DomainWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveFallbackReputationSnapshotsFromWindow(items: DomainWindow[]): FallbackReputationSnapshot[] {
  const out: FallbackReputationSnapshot[] = [];
  for (const item of items) {
    const derived = newFallbackReputationSnapshot(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateFallbackReputationSnapshot(item: FallbackReputationSnapshot): string {
  return normalizeSeasonalDomainVarianceCode(item.code);
}
