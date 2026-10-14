import { DefaultPaywallRequest } from "../request/default-paywall-request.js";
import { paywallProfileWeight } from "../request/paywall-profile-policy.js";
import { RegionalPaywallSnapshot, newRegionalPaywallSnapshot } from "./regional-paywall-snapshot.js";

export function summarizeDefaultPaywallRequestsForSnapshot(items: DefaultPaywallRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveRegionalPaywallSnapshotsFromRequest(items: DefaultPaywallRequest[]): RegionalPaywallSnapshot[] {
  const out: RegionalPaywallSnapshot[] = [];
  for (const item of items) {
    const derived = newRegionalPaywallSnapshot(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreRegionalPaywallSnapshot(item: RegionalPaywallSnapshot): number {
  return paywallProfileWeight(8, true);
}
