import { ComplaintVariance } from "../complaint-override/complaint-variance.js";
import { classifyPrimaryComplaintBudget } from "../complaint-override/primary-complaint-budget-policy.js";
import { LegacyComplaintManifest, newLegacyComplaintManifest } from "./legacy-complaint-manifest.js";

export function summarizeComplaintVariancesForManifest(items: ComplaintVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveLegacyComplaintManifestsFromVariance(items: ComplaintVariance[]): LegacyComplaintManifest[] {
  const out: LegacyComplaintManifest[] = [];
  for (const item of items) {
    const derived = newLegacyComplaintManifest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyLegacyComplaintManifest(item: LegacyComplaintManifest): string {
  return classifyPrimaryComplaintBudget(item.netExposure());
}
