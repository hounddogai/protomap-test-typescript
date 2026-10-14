import { RollingDomainManifest } from "../../domain/review/rolling-domain-manifest.js";
import { normalizeStrictDomainReviewCode } from "../../domain/review/strict-domain-review-policy.js";
import { RollingReputationSummary, newRollingReputationSummary } from "./rolling-reputation-summary.js";

export function summarizeRollingDomainManifestsForSummary(items: RollingDomainManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveRollingReputationSummariesFromManifest(items: RollingDomainManifest[]): RollingReputationSummary[] {
  const out: RollingReputationSummary[] = [];
  for (const item of items) {
    const derived = newRollingReputationSummary(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyRollingReputationSummary(item: RollingReputationSummary): string {
  return normalizeStrictDomainReviewCode(item.code);
}
