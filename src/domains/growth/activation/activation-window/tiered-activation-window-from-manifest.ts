import { primaryFunnelManifestWeight } from "../../funnel/funnel-manifest/primary-funnel-manifest-policy.js";
import { PrimaryFunnelManifest } from "../../funnel/funnel-manifest/primary-funnel-manifest.js";
import { TieredActivationWindow, newTieredActivationWindow } from "./tiered-activation-window.js";

export function summarizePrimaryFunnelManifestsForWindow(items: PrimaryFunnelManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveTieredActivationWindowsFromManifest(items: PrimaryFunnelManifest[]): TieredActivationWindow[] {
  const out: TieredActivationWindow[] = [];
  for (const item of items) {
    const derived = newTieredActivationWindow(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveTieredActivationWindow(item: TieredActivationWindow): number {
  return primaryFunnelManifestWeight(3, true);
}
