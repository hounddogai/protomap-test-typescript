import { batchedPaywallTemplateBucket } from "../../paywall/paywall-schedule/batched-paywall-template-policy.js";
import { BatchedPaywallTemplate } from "../../paywall/paywall-schedule/batched-paywall-template.js";
import { RetentionPolicy, newRetentionPolicy } from "./retention-policy.js";

export function summarizeBatchedPaywallTemplatesForPolicy(items: BatchedPaywallTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveRetentionPoliciesFromTemplate(items: BatchedPaywallTemplate[]): RetentionPolicy[] {
  const out: RetentionPolicy[] = [];
  for (const item of items) {
    const derived = newRetentionPolicy(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveRetentionPolicyExtra(item: RetentionPolicy): string {
  return batchedPaywallTemplateBucket(item.netValue());
}
