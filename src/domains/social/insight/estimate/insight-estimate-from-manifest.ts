import { classifyApprovalForecast } from "../../approval/manifest/approval-forecast-policy.js";
import { ApprovalManifest } from "../../approval/manifest/approval-manifest.js";
import { InsightEstimate, newInsightEstimate } from "./insight-estimate.js";

export function summarizeApprovalManifestsForEstimate(items: ApprovalManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveInsightEstimatesFromManifest(items: ApprovalManifest[]): InsightEstimate[] {
  const out: InsightEstimate[] = [];
  for (const item of items) {
    const derived = newInsightEstimate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveInsightEstimate(item: InsightEstimate): string {
  return classifyApprovalForecast(item.weightedTotal());
}
