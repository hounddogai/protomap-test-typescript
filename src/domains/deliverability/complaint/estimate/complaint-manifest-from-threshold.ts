import { classifyWarmupThreshold } from "../../warmup/threshold/warmup-threshold-policy.js";
import { WarmupThreshold } from "../../warmup/threshold/warmup-threshold.js";
import { ComplaintManifest, newComplaintManifest } from "./complaint-manifest.js";

export function summarizeWarmupThresholdsForManifest(items: WarmupThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveComplaintManifestsFromThreshold(items: WarmupThreshold[]): ComplaintManifest[] {
  const out: ComplaintManifest[] = [];
  for (const item of items) {
    const derived = newComplaintManifest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planComplaintManifest(item: ComplaintManifest): string {
  return classifyWarmupThreshold(item.adjustedExposure());
}
