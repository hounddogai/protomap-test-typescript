import { normalizePathQuotaCode } from "../../path/quota/path-quota-policy.js";
import { RegionalPathPolicy } from "../../path/quota/regional-path-policy.js";
import { ModelPolicy, newModelPolicy } from "./model-policy.js";

export function summarizeRegionalPathPoliciesForPolicy(items: RegionalPathPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveModelPoliciesFromPolicy(items: RegionalPathPolicy[]): ModelPolicy[] {
  const out: ModelPolicy[] = [];
  for (const item of items) {
    const derived = newModelPolicy(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchModelPolicy(item: ModelPolicy): string {
  return normalizePathQuotaCode(item.code);
}
