import { MacroDigest } from "../../macro/threshold/macro-digest.js";
import { macroReviewWeight } from "../../macro/threshold/macro-review-policy.js";
import { FallbackDeflectionDigest, newFallbackDeflectionDigest } from "./fallback-deflection-digest.js";

export function summarizeMacroDigestsForDigest(items: MacroDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveFallbackDeflectionDigestsFromDigest(items: MacroDigest[]): FallbackDeflectionDigest[] {
  const out: FallbackDeflectionDigest[] = [];
  for (const item of items) {
    const derived = newFallbackDeflectionDigest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyFallbackDeflectionDigest(item: FallbackDeflectionDigest): number {
  return macroReviewWeight(2, true);
}
