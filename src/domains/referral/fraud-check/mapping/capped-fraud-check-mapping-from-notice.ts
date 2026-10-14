import { normalizeScheduledPayoutNoticeCode } from "../../payout/policy/scheduled-payout-notice-policy.js";
import { ScheduledPayoutNotice } from "../../payout/policy/scheduled-payout-notice.js";
import { CappedFraudCheckMapping, newCappedFraudCheckMapping } from "./capped-fraud-check-mapping.js";

export function summarizeScheduledPayoutNoticesForMapping(items: ScheduledPayoutNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveCappedFraudCheckMappingsFromNotice(items: ScheduledPayoutNotice[]): CappedFraudCheckMapping[] {
  const out: CappedFraudCheckMapping[] = [];
  for (const item of items) {
    const derived = newCappedFraudCheckMapping(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreCappedFraudCheckMapping(item: CappedFraudCheckMapping): string {
  return normalizeScheduledPayoutNoticeCode(item.code);
}
