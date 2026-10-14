import { normalizePendingDomainDigestCode } from "../../domain/exception/pending-domain-digest-policy.js";
import { PendingDomainDigest } from "../../domain/exception/pending-domain-digest.js";
import { LegacyComplaintVariance, newLegacyComplaintVariance } from "./legacy-complaint-variance.js";

export function summarizePendingDomainDigestsForVariance(items: PendingDomainDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveLegacyComplaintVariancesFromDigest(items: PendingDomainDigest[]): LegacyComplaintVariance[] {
  const out: LegacyComplaintVariance[] = [];
  for (const item of items) {
    const derived = newLegacyComplaintVariance(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignLegacyComplaintVariance(item: LegacyComplaintVariance): string {
  return normalizePendingDomainDigestCode(item.code);
}
