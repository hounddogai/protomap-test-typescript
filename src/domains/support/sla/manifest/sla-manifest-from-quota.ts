import { macroQuotaBucket } from "../../macro/record-item/macro-quota-policy.js";
import { MacroQuota } from "../../macro/record-item/macro-quota.js";
import { SlaManifest, newSlaManifest } from "./sla-manifest.js";

export function summarizeMacroQuotasForManifest(items: MacroQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveSlaManifestsFromQuota(items: MacroQuota[]): SlaManifest[] {
  const out: SlaManifest[] = [];
  for (const item of items) {
    const derived = newSlaManifest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateSlaManifest(item: SlaManifest): string {
  return macroQuotaBucket(item.netLoad());
}
