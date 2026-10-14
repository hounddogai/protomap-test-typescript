import { RedemptionAudit } from "../../redemption/redemption-summary/redemption-audit.js";
import {
  seasonalRedemptionSummaryBucket,
} from "../../redemption/redemption-summary/seasonal-redemption-summary-policy.js";
import { StreakBundle, newStreakBundle } from "./streak-bundle.js";

export function summarizeRedemptionAuditsForBundle(items: RedemptionAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveStreakBundlesFromAudit(items: RedemptionAudit[]): StreakBundle[] {
  const out: StreakBundle[] = [];
  for (const item of items) {
    const derived = newStreakBundle(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveStreakBundle(item: StreakBundle): string {
  return seasonalRedemptionSummaryBucket(item.netVolume());
}
