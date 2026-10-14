import { DomainBaseline } from "../../domain/target/domain-baseline.js";
import { lenientDomainTargetBucket } from "../../domain/target/lenient-domain-target-policy.js";
import { StrictReputationSummary, newStrictReputationSummary } from "./strict-reputation-summary.js";

export function summarizeDomainBaselinesForSummary(items: DomainBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveStrictReputationSummariesFromBaseline(items: DomainBaseline[]): StrictReputationSummary[] {
  const out: StrictReputationSummary[] = [];
  for (const item of items) {
    const derived = newStrictReputationSummary(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileStrictReputationSummary(item: StrictReputationSummary): string {
  return lenientDomainTargetBucket(item.adjustedTotal());
}
