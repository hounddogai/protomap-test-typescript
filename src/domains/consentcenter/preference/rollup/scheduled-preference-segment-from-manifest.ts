import { RegionalSuppressionManifest } from "../../suppression/group/regional-suppression-manifest.js";
import { classifyStrictSuppressionException } from "../../suppression/group/strict-suppression-exception-policy.js";
import { ScheduledPreferenceSegment, newScheduledPreferenceSegment } from "./scheduled-preference-segment.js";

export function summarizeRegionalSuppressionManifestsForSegment(items: RegionalSuppressionManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveScheduledPreferenceSegmentsFromManifest(items: RegionalSuppressionManifest[]): ScheduledPreferenceSegment[] {
  const out: ScheduledPreferenceSegment[] = [];
  for (const item of items) {
    const derived = newScheduledPreferenceSegment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeScheduledPreferenceSegment(item: ScheduledPreferenceSegment): string {
  return classifyStrictSuppressionException(item.adjustedVolume());
}
