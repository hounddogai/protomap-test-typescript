import { PendingLevelOverride } from "../../level/level-quota/pending-level-override.js";
import { normalizeSeasonalLevelWindowCode } from "../../level/level-quota/seasonal-level-window-policy.js";
import { TieredChallengeException, newTieredChallengeException } from "./tiered-challenge-exception.js";

export function summarizePendingLevelOverridesForException(items: PendingLevelOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveTieredChallengeExceptionsFromOverride(items: PendingLevelOverride[]): TieredChallengeException[] {
  const out: TieredChallengeException[] = [];
  for (const item of items) {
    const derived = newTieredChallengeException(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateTieredChallengeException(item: TieredChallengeException): string {
  return normalizeSeasonalLevelWindowCode(item.code);
}
