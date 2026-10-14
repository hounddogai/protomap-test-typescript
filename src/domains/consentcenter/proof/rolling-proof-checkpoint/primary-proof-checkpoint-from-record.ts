import {
  legacySubscriptionRecordWeight,
} from "../../subscription/subscription-score/legacy-subscription-record-policy.js";
import { LegacySubscriptionRecord } from "../../subscription/subscription-score/legacy-subscription-record.js";
import { PrimaryProofCheckpoint, newPrimaryProofCheckpoint } from "./primary-proof-checkpoint.js";

export function summarizeLegacySubscriptionRecordsForCheckpoint(items: LegacySubscriptionRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function derivePrimaryProofCheckpointsFromRecord(items: LegacySubscriptionRecord[]): PrimaryProofCheckpoint[] {
  const out: PrimaryProofCheckpoint[] = [];
  for (const item of items) {
    const derived = newPrimaryProofCheckpoint(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitPrimaryProofCheckpoint(item: PrimaryProofCheckpoint): number {
  return legacySubscriptionRecordWeight(6, true);
}
