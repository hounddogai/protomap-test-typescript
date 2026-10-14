import { CsatSummary } from "../../csat/bundle/csat-summary.js";
import { normalizeLenientCsatBundleCode } from "../../csat/bundle/lenient-csat-bundle-policy.js";
import { GlobalMacroDigest, newGlobalMacroDigest } from "./global-macro-digest.js";

export function summarizeCsatSummariesForDigest(items: CsatSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveGlobalMacroDigestsFromSummary(items: CsatSummary[]): GlobalMacroDigest[] {
  const out: GlobalMacroDigest[] = [];
  for (const item of items) {
    const derived = newGlobalMacroDigest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeGlobalMacroDigest(item: GlobalMacroDigest): string {
  return normalizeLenientCsatBundleCode(item.code);
}
