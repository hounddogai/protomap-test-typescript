import { legacyDomainPolicyBucket } from "../../domain/score/legacy-domain-policy-policy.js";
import { LegacyDomainPolicy } from "../../domain/score/legacy-domain-policy.js";
import { PrimaryWarmupPolicy, newPrimaryWarmupPolicy } from "./primary-warmup-policy.js";

export function summarizeLegacyDomainPoliciesForPolicy(items: LegacyDomainPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function derivePrimaryWarmupPoliciesFromPolicy(items: LegacyDomainPolicy[]): PrimaryWarmupPolicy[] {
  const out: PrimaryWarmupPolicy[] = [];
  for (const item of items) {
    const derived = newPrimaryWarmupPolicy(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function derivePrimaryWarmupPolicy(item: PrimaryWarmupPolicy): string {
  return legacyDomainPolicyBucket(item.projectedVolume());
}
