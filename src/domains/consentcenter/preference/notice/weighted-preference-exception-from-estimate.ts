import {
  adaptiveSubscriptionCheckpointWeight,
} from "../../subscription/subscription-checkpoint/adaptive-subscription-checkpoint-policy.js";
import {
  FallbackSubscriptionEstimate,
} from "../../subscription/subscription-checkpoint/fallback-subscription-estimate.js";
import { WeightedPreferenceException, newWeightedPreferenceException } from "./weighted-preference-exception.js";

export function summarizeFallbackSubscriptionEstimatesForException(items: FallbackSubscriptionEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveWeightedPreferenceExceptionsFromEstimate(items: FallbackSubscriptionEstimate[]): WeightedPreferenceException[] {
  const out: WeightedPreferenceException[] = [];
  for (const item of items) {
    const derived = newWeightedPreferenceException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleWeightedPreferenceException(item: WeightedPreferenceException): number {
  return adaptiveSubscriptionCheckpointWeight(5, true);
}
