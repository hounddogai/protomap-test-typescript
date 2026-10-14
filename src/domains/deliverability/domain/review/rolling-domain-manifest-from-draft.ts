import { LegacyComplaintDraft } from "../../complaint/draft/legacy-complaint-draft.js";
import { classifySeasonalComplaintAgreement } from "../../complaint/draft/seasonal-complaint-agreement-policy.js";
import { RollingDomainManifest, newRollingDomainManifest } from "./rolling-domain-manifest.js";

export function summarizeLegacyComplaintDraftsForManifest(items: LegacyComplaintDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveRollingDomainManifestsFromDraft(items: LegacyComplaintDraft[]): RollingDomainManifest[] {
  const out: RollingDomainManifest[] = [];
  for (const item of items) {
    const derived = newRollingDomainManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileRollingDomainManifest(item: RollingDomainManifest): string {
  return classifySeasonalComplaintAgreement(item.weightedExposure());
}
