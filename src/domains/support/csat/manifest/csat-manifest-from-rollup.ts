import { escalationManifestBucket } from "../../escalation/metric/escalation-manifest-policy.js";
import { EscalationRollup } from "../../escalation/metric/escalation-rollup.js";
import { CsatManifest, newCsatManifest } from "./csat-manifest.js";

export function summarizeEscalationRollupsForManifest(items: EscalationRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveCsatManifestsFromRollup(items: EscalationRollup[]): CsatManifest[] {
  const out: CsatManifest[] = [];
  for (const item of items) {
    const derived = newCsatManifest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectCsatManifest(item: CsatManifest): string {
  return escalationManifestBucket(item.effectiveTotal());
}
