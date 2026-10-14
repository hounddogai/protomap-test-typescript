import { classifyFraudCheckClaim } from "../claim/fraud-check-claim-policy.js";
import { FraudCheckTarget } from "../claim/fraud-check-target.js";
import { FraudCheckSnapshot, newFraudCheckSnapshot } from "./fraud-check-snapshot.js";

export function summarizeFraudCheckTargetsForSnapshot(items: FraudCheckTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveFraudCheckSnapshotsFromTarget(items: FraudCheckTarget[]): FraudCheckSnapshot[] {
  const out: FraudCheckSnapshot[] = [];
  for (const item of items) {
    const derived = newFraudCheckSnapshot(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeFraudCheckSnapshot(item: FraudCheckSnapshot): string {
  return classifyFraudCheckClaim(item.effectiveLoad());
}
