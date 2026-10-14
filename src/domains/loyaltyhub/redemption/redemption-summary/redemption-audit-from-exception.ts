import { RedemptionException } from "../exception/redemption-exception.js";
import { redemptionForecastWeight } from "../exception/redemption-forecast-policy.js";
import { RedemptionAudit, newRedemptionAudit } from "./redemption-audit.js";

export function summarizeRedemptionExceptionsForAudit(items: RedemptionException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveRedemptionAuditsFromException(items: RedemptionException[]): RedemptionAudit[] {
  const out: RedemptionAudit[] = [];
  for (const item of items) {
    const derived = newRedemptionAudit(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settleRedemptionAudit(item: RedemptionAudit): number {
  return redemptionForecastWeight(1, true);
}
