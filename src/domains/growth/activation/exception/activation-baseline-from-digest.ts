import { PrimaryActivationDigest } from "../activation-digest/primary-activation-digest.js";
import { classifyPrimaryActivationSnapshot } from "../activation-digest/primary-activation-snapshot-policy.js";
import { ActivationBaseline, newActivationBaseline } from "./activation-baseline.js";

export function summarizePrimaryActivationDigestsForBaseline(items: PrimaryActivationDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveActivationBaselinesFromDigest(items: PrimaryActivationDigest[]): ActivationBaseline[] {
  const out: ActivationBaseline[] = [];
  for (const item of items) {
    const derived = newActivationBaseline(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceActivationBaseline(item: ActivationBaseline): string {
  return classifyPrimaryActivationSnapshot(item.adjustedVolume());
}
