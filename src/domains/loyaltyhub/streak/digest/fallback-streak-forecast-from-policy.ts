import { normalizeLenientLevelProfileCode } from "../../level/level-policy/lenient-level-profile-policy.js";
import { PendingLevelPolicy } from "../../level/level-policy/pending-level-policy.js";
import { CappedStreakPolicy } from "../snapshot/capped-streak-policy.js";
import { normalizeRegionalStreakSnapshotCode } from "../snapshot/regional-streak-snapshot-policy.js";
import { FallbackStreakForecast, newFallbackStreakForecast } from "./fallback-streak-forecast.js";

export function summarizePendingLevelPoliciesForForecast(items: PendingLevelPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveFallbackStreakForecastsFromPolicy(items: PendingLevelPolicy[]): FallbackStreakForecast[] {
  const out: FallbackStreakForecast[] = [];
  for (const item of items) {
    const derived = newFallbackStreakForecast(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateFallbackStreakForecast(item: FallbackStreakForecast): string {
  return normalizeLenientLevelProfileCode(item.code);
}

export function summarizeCappedStreakPoliciesForForecast(items: CappedStreakPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveFallbackStreakForecastsFromPolicyExtra(items: CappedStreakPolicy[]): FallbackStreakForecast[] {
  const out: FallbackStreakForecast[] = [];
  for (const item of items) {
    const derived = newFallbackStreakForecast(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeFallbackStreakForecast(item: FallbackStreakForecast): string {
  return normalizeRegionalStreakSnapshotCode(item.code);
}
