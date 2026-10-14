import {
  normalizeFallbackNudgeSummaryCode,
} from "../../nudge/regional-nudge-exception/fallback-nudge-summary-policy.js";
import { NudgeTier } from "../../nudge/regional-nudge-exception/nudge-tier.js";
import { AdaptivePaywallTemplate, newAdaptivePaywallTemplate } from "./adaptive-paywall-template.js";

export function summarizeNudgeTiersForTemplate(items: NudgeTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveAdaptivePaywallTemplatesFromTier(items: NudgeTier[]): AdaptivePaywallTemplate[] {
  const out: AdaptivePaywallTemplate[] = [];
  for (const item of items) {
    const derived = newAdaptivePaywallTemplate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeAdaptivePaywallTemplate(item: AdaptivePaywallTemplate): string {
  return normalizeFallbackNudgeSummaryCode(item.code);
}
