import { CappedPaywallScore } from "../../paywall/legacy-paywall-metric/capped-paywall-score.js";
import {
  normalizeLenientPaywallMetricCode,
} from "../../paywall/legacy-paywall-metric/lenient-paywall-metric-policy.js";
import { StrictActivationException, newStrictActivationException } from "./strict-activation-exception.js";

export function summarizeCappedPaywallScoresForException(items: CappedPaywallScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStrictActivationExceptionsFromScore(items: CappedPaywallScore[]): StrictActivationException[] {
  const out: StrictActivationException[] = [];
  for (const item of items) {
    const derived = newStrictActivationException(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreStrictActivationException(item: StrictActivationException): string {
  return normalizeLenientPaywallMetricCode(item.code);
}
