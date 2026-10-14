import { macroBaselineBucket } from "../../macro/baseline/macro-baseline-policy.js";
import { MacroBaseline } from "../../macro/baseline/macro-baseline.js";
import { DefaultDeflectionDigest, newDefaultDeflectionDigest } from "./default-deflection-digest.js";

export function summarizeMacroBaselinesForDigest(items: MacroBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveDefaultDeflectionDigestsFromBaseline(items: MacroBaseline[]): DefaultDeflectionDigest[] {
  const out: DefaultDeflectionDigest[] = [];
  for (const item of items) {
    const derived = newDefaultDeflectionDigest(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateDefaultDeflectionDigest(item: DefaultDeflectionDigest): string {
  return macroBaselineBucket(item.effectiveVolume());
}
