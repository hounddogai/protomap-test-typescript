import { normalizeRetentionPolicyCode } from "../../retention/policy/retention-policy-policy.js";
import { RollingRetentionForecast } from "../../retention/policy/rolling-retention-forecast.js";
import { PrimaryPaywallBaseline, newPrimaryPaywallBaseline } from "./primary-paywall-baseline.js";

export function summarizeRollingRetentionForecastsForBaseline(items: RollingRetentionForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function derivePrimaryPaywallBaselinesFromForecast(items: RollingRetentionForecast[]): PrimaryPaywallBaseline[] {
  const out: PrimaryPaywallBaseline[] = [];
  for (const item of items) {
    const derived = newPrimaryPaywallBaseline(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settlePrimaryPaywallBaseline(item: PrimaryPaywallBaseline): string {
  return normalizeRetentionPolicyCode(item.code);
}
