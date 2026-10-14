import { normalizeRegionalStreakTierCode } from "../../streak/ledger/regional-streak-tier-policy.js";
import { RegionalStreakTier } from "../../streak/ledger/regional-streak-tier.js";
import { RegionalRedemptionDraft, newRegionalRedemptionDraft } from "./regional-redemption-draft.js";

export function summarizeRegionalStreakTiersForDraft(items: RegionalStreakTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveRegionalRedemptionDraftsFromTier(items: RegionalStreakTier[]): RegionalRedemptionDraft[] {
  const out: RegionalRedemptionDraft[] = [];
  for (const item of items) {
    const derived = newRegionalRedemptionDraft(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveRegionalRedemptionDraft(item: RegionalRedemptionDraft): string {
  return normalizeRegionalStreakTierCode(item.code);
}
