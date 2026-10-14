import { CappedDoubleOptInBundle } from "../../double-opt-in/batched-in-bundle/capped-double-opt-in-bundle.js";
import {
  classifyLegacyDoubleOptInLedger,
} from "../../double-opt-in/batched-in-bundle/legacy-double-opt-in-ledger-policy.js";
import { LegacySubscriptionBundle, newLegacySubscriptionBundle } from "./legacy-subscription-bundle.js";

export function summarizeCappedDoubleOptInBundlesForBundle(items: CappedDoubleOptInBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveLegacySubscriptionBundlesFromBundle(items: CappedDoubleOptInBundle[]): LegacySubscriptionBundle[] {
  const out: LegacySubscriptionBundle[] = [];
  for (const item of items) {
    const derived = newLegacySubscriptionBundle(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveLegacySubscriptionBundle(item: LegacySubscriptionBundle): string {
  return classifyLegacyDoubleOptInLedger(item.adjustedVolume());
}
