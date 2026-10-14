import { SenderClaim } from "../proposal/sender-claim.js";
import { classifySenderProposal } from "../proposal/sender-proposal-policy.js";
import { SenderRequest, newSenderRequest } from "./sender-request.js";

export function summarizeSenderClaimsForRequest(items: SenderClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveSenderRequestsFromClaim(items: SenderClaim[]): SenderRequest[] {
  const out: SenderRequest[] = [];
  for (const item of items) {
    const derived = newSenderRequest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifySenderRequest(item: SenderRequest): string {
  return classifySenderProposal(item.projectedTotal());
}
