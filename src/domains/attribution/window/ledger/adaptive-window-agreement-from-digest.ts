import { classifyPrimaryPathDigest } from "../../path/digest/primary-path-digest-policy.js";
import { PrimaryPathDigest } from "../../path/digest/primary-path-digest.js";
import { AdaptiveWindowAgreement, newAdaptiveWindowAgreement } from "./adaptive-window-agreement.js";

export function summarizePrimaryPathDigestsForAgreement(items: PrimaryPathDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveAdaptiveWindowAgreementsFromDigest(items: PrimaryPathDigest[]): AdaptiveWindowAgreement[] {
  const out: AdaptiveWindowAgreement[] = [];
  for (const item of items) {
    const derived = newAdaptiveWindowAgreement(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitAdaptiveWindowAgreement(item: AdaptiveWindowAgreement): string {
  return classifyPrimaryPathDigest(item.netLoad());
}
