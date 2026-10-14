import { normalizeGlobalStreakProfileCode } from "../quota/global-streak-profile-policy.js";
import { PendingStreakQuota } from "../quota/pending-streak-quota.js";
import { FallbackStreakBundle, newFallbackStreakBundle } from "./fallback-streak-bundle.js";

export function summarizePendingStreakQuotasForBundle(items: PendingStreakQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveFallbackStreakBundlesFromQuota(items: PendingStreakQuota[]): FallbackStreakBundle[] {
  const out: FallbackStreakBundle[] = [];
  for (const item of items) {
    const derived = newFallbackStreakBundle(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeFallbackStreakBundle(item: FallbackStreakBundle): string {
  return normalizeGlobalStreakProfileCode(item.code);
}
