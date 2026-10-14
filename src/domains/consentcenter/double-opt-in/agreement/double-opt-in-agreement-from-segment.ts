import {
  normalizePrimarySubscriptionSegmentCode,
} from "../../subscription/subscription-segment/primary-subscription-segment-policy.js";
import { PrimarySubscriptionSegment } from "../../subscription/subscription-segment/primary-subscription-segment.js";
import { DoubleOptInAgreement, newDoubleOptInAgreement } from "./double-opt-in-agreement.js";

export function summarizePrimarySubscriptionSegmentsForAgreement(items: PrimarySubscriptionSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveDoubleOptInAgreementsFromSegment(items: PrimarySubscriptionSegment[]): DoubleOptInAgreement[] {
  const out: DoubleOptInAgreement[] = [];
  for (const item of items) {
    const derived = newDoubleOptInAgreement(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planDoubleOptInAgreement(item: DoubleOptInAgreement): string {
  return normalizePrimarySubscriptionSegmentCode(item.code);
}
