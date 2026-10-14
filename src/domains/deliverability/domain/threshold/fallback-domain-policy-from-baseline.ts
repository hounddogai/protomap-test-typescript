import { adaptiveWarmupBudgetBucket } from "../../warmup/baseline/adaptive-warmup-budget-policy.js";
import { WarmupBaseline } from "../../warmup/baseline/warmup-baseline.js";
import { FallbackDomainPolicy, newFallbackDomainPolicy } from "./fallback-domain-policy.js";

export function summarizeWarmupBaselinesForPolicy(items: WarmupBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveFallbackDomainPoliciesFromBaseline(items: WarmupBaseline[]): FallbackDomainPolicy[] {
  const out: FallbackDomainPolicy[] = [];
  for (const item of items) {
    const derived = newFallbackDomainPolicy(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateFallbackDomainPolicy(item: FallbackDomainPolicy): string {
  return adaptiveWarmupBudgetBucket(item.adjustedLoad());
}
