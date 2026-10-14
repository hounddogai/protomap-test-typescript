import { LegacyBadgeNotice } from "../../badge/adjustment/legacy-badge-notice.js";
import { classifyTieredBadgeAdjustment } from "../../badge/adjustment/tiered-badge-adjustment-policy.js";
import { TieredChallengeException, newTieredChallengeException } from "./tiered-challenge-exception.js";

export function summarizeLegacyBadgeNoticesForException(items: LegacyBadgeNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveTieredChallengeExceptionsFromNotice(items: LegacyBadgeNotice[]): TieredChallengeException[] {
  const out: TieredChallengeException[] = [];
  for (const item of items) {
    const derived = newTieredChallengeException(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveTieredChallengeException(item: TieredChallengeException): string {
  return classifyTieredBadgeAdjustment(item.measuredValue());
}
