import {
  classifyDefaultChallengeThreshold,
} from "../../challenge/primary-challenge-override/default-challenge-threshold-policy.js";
import { TieredChallengeAudit } from "../../challenge/primary-challenge-override/tiered-challenge-audit.js";
import { DefaultBadgeSlot, newDefaultBadgeSlot } from "./default-badge-slot.js";

export function summarizeTieredChallengeAuditsForSlot(items: TieredChallengeAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveDefaultBadgeSlotsFromAudit(items: TieredChallengeAudit[]): DefaultBadgeSlot[] {
  const out: DefaultBadgeSlot[] = [];
  for (const item of items) {
    const derived = newDefaultBadgeSlot(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeDefaultBadgeSlot(item: DefaultBadgeSlot): string {
  return classifyDefaultChallengeThreshold(item.projectedLoad());
}
