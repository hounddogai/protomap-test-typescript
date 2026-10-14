import { defaultDomainTemplateBucket } from "../../domain/claim/default-domain-template-policy.js";
import { DomainClaim } from "../../domain/claim/domain-claim.js";
import { PrimaryReputationClaim } from "../claim/primary-reputation-claim.js";
import { classifyReputationForecast } from "../claim/reputation-forecast-policy.js";
import { ReputationAllocation, newReputationAllocation } from "./reputation-allocation.js";

export function summarizeDomainClaimsForAllocation(items: DomainClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveReputationAllocationsFromClaim(items: DomainClaim[]): ReputationAllocation[] {
  const out: ReputationAllocation[] = [];
  for (const item of items) {
    const derived = newReputationAllocation(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchReputationAllocation(item: ReputationAllocation): string {
  return defaultDomainTemplateBucket(item.effectiveValue());
}

export function summarizePrimaryReputationClaimsForAllocation(items: PrimaryReputationClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveReputationAllocationsFromClaimExtra(items: PrimaryReputationClaim[]): ReputationAllocation[] {
  const out: ReputationAllocation[] = [];
  for (const item of items) {
    const derived = newReputationAllocation(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchReputationAllocationExtra(item: ReputationAllocation): string {
  return classifyReputationForecast(item.effectiveValue());
}
