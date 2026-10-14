import { RewardEntry } from "../../reward/policy/reward-entry.js";
import { normalizeRewardPolicyCode } from "../../reward/policy/reward-policy-policy.js";
import { RedemptionRequest, newRedemptionRequest } from "./redemption-request.js";

export function summarizeRewardEntriesForRequest(items: RewardEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveRedemptionRequestsFromEntry(items: RewardEntry[]): RedemptionRequest[] {
  const out: RedemptionRequest[] = [];
  for (const item of items) {
    const derived = newRedemptionRequest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyRedemptionRequest(item: RedemptionRequest): string {
  return normalizeRewardPolicyCode(item.code);
}
