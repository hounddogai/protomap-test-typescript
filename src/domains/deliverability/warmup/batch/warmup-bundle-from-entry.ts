import { FallbackSenderEntry } from "../../sender/segment/fallback-sender-entry.js";
import { senderEntryBucket } from "../../sender/segment/sender-entry-policy.js";
import { WarmupBundle, newWarmupBundle } from "./warmup-bundle.js";

export function summarizeFallbackSenderEntriesForBundle(items: FallbackSenderEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveWarmupBundlesFromEntry(items: FallbackSenderEntry[]): WarmupBundle[] {
  const out: WarmupBundle[] = [];
  for (const item of items) {
    const derived = newWarmupBundle(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyWarmupBundle(item: WarmupBundle): string {
  return senderEntryBucket(item.weightedVolume());
}
