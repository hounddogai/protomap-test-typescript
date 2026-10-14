import { ChallengeLedger } from "../profile/challenge-ledger.js";
import { challengeProfileBucket } from "../profile/challenge-profile-policy.js";
import { ChallengeRecord, newChallengeRecord } from "./challenge-record.js";

export function summarizeChallengeLedgersForRecord(items: ChallengeLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveChallengeRecordsFromLedger(items: ChallengeLedger[]): ChallengeRecord[] {
  const out: ChallengeRecord[] = [];
  for (const item of items) {
    const derived = newChallengeRecord(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitChallengeRecord(item: ChallengeRecord): string {
  return challengeProfileBucket(item.netExposure());
}
