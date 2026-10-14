import { CappedDeflectionTemplate } from "../../deflection/deflection-manifest/capped-deflection-template.js";
import {
  normalizeLenientDeflectionManifestCode,
} from "../../deflection/deflection-manifest/lenient-deflection-manifest-policy.js";
import { FallbackMacroSnapshot, newFallbackMacroSnapshot } from "./fallback-macro-snapshot.js";

export function summarizeCappedDeflectionTemplatesForSnapshot(items: CappedDeflectionTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveFallbackMacroSnapshotsFromTemplate(items: CappedDeflectionTemplate[]): FallbackMacroSnapshot[] {
  const out: FallbackMacroSnapshot[] = [];
  for (const item of items) {
    const derived = newFallbackMacroSnapshot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignFallbackMacroSnapshot(item: FallbackMacroSnapshot): string {
  return normalizeLenientDeflectionManifestCode(item.code);
}
