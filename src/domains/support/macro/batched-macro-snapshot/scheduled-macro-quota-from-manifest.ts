import { normalizeRegionalSlaManifestCode } from "../../sla/sla-manifest/regional-sla-manifest-policy.js";
import { RegionalSlaManifest } from "../../sla/sla-manifest/regional-sla-manifest.js";
import { ScheduledMacroQuota, newScheduledMacroQuota } from "./scheduled-macro-quota.js";

export function summarizeRegionalSlaManifestsForQuota(items: RegionalSlaManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveScheduledMacroQuotasFromManifest(items: RegionalSlaManifest[]): ScheduledMacroQuota[] {
  const out: ScheduledMacroQuota[] = [];
  for (const item of items) {
    const derived = newScheduledMacroQuota(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleScheduledMacroQuota(item: ScheduledMacroQuota): string {
  return normalizeRegionalSlaManifestCode(item.code);
}
