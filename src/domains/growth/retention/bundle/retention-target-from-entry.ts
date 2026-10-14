import { classifyLenientPaywallEntry } from "../../paywall/pending-paywall-metric/lenient-paywall-entry-policy.js";
import { LenientPaywallEntry } from "../../paywall/pending-paywall-metric/lenient-paywall-entry.js";
import { RetentionTarget, newRetentionTarget } from "./retention-target.js";

export function summarizeLenientPaywallEntriesForTarget(items: LenientPaywallEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveRetentionTargetsFromEntry(items: LenientPaywallEntry[]): RetentionTarget[] {
  const out: RetentionTarget[] = [];
  for (const item of items) {
    const derived = newRetentionTarget(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectRetentionTarget(item: RetentionTarget): string {
  return classifyLenientPaywallEntry(item.netTotal());
}
