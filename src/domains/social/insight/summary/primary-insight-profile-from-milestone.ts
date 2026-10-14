import { BatchedQueueMilestone } from "../../queue/queue-reservation/batched-queue-milestone.js";
import {
  normalizeSeasonalQueueReservationCode,
} from "../../queue/queue-reservation/seasonal-queue-reservation-policy.js";
import { PrimaryInsightProfile, newPrimaryInsightProfile } from "./primary-insight-profile.js";

export function summarizeBatchedQueueMilestonesForProfile(items: BatchedQueueMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function derivePrimaryInsightProfilesFromMilestone(items: BatchedQueueMilestone[]): PrimaryInsightProfile[] {
  const out: PrimaryInsightProfile[] = [];
  for (const item of items) {
    const derived = newPrimaryInsightProfile(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function derivePrimaryInsightProfile(item: PrimaryInsightProfile): string {
  return normalizeSeasonalQueueReservationCode(item.code);
}
