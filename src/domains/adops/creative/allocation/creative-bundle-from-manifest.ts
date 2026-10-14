import { creativeExceptionWeight } from "../exception/creative-exception-policy.js";
import { CreativeManifest } from "../exception/creative-manifest.js";
import { CreativeBundle, newCreativeBundle } from "./creative-bundle.js";

export function summarizeCreativeManifestsForBundle(items: CreativeManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveCreativeBundlesFromManifest(items: CreativeManifest[]): CreativeBundle[] {
  const out: CreativeBundle[] = [];
  for (const item of items) {
    const derived = newCreativeBundle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeCreativeBundle(item: CreativeBundle): number {
  return creativeExceptionWeight(5, true);
}
