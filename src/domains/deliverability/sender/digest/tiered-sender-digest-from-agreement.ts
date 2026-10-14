import { normalizeScheduledSenderAgreementCode } from "../profile/scheduled-sender-agreement-policy.js";
import { ScheduledSenderAgreement } from "../profile/scheduled-sender-agreement.js";
import { TieredSenderDigest, newTieredSenderDigest } from "./tiered-sender-digest.js";

export function summarizeScheduledSenderAgreementsForDigest(items: ScheduledSenderAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveTieredSenderDigestsFromAgreement(items: ScheduledSenderAgreement[]): TieredSenderDigest[] {
  const out: TieredSenderDigest[] = [];
  for (const item of items) {
    const derived = newTieredSenderDigest(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateTieredSenderDigest(item: TieredSenderDigest): string {
  return normalizeScheduledSenderAgreementCode(item.code);
}
