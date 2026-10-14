import {
  normalizeLegacyTouchpointTemplateCode,
} from "../../touchpoint/template/legacy-touchpoint-template-policy.js";
import { PrimaryTouchpointAssignment } from "../../touchpoint/template/primary-touchpoint-assignment.js";
import { FallbackCreditSegment, newFallbackCreditSegment } from "./fallback-credit-segment.js";

export function summarizePrimaryTouchpointAssignmentsForSegment(items: PrimaryTouchpointAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveFallbackCreditSegmentsFromAssignment(items: PrimaryTouchpointAssignment[]): FallbackCreditSegment[] {
  const out: FallbackCreditSegment[] = [];
  for (const item of items) {
    const derived = newFallbackCreditSegment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankFallbackCreditSegment(item: FallbackCreditSegment): string {
  return normalizeLegacyTouchpointTemplateCode(item.code);
}
