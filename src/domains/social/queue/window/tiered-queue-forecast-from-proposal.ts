import { normalizeDefaultReplyProposalCode } from "../../reply/policy/default-reply-proposal-policy.js";
import { DefaultReplyProposal } from "../../reply/policy/default-reply-proposal.js";
import { TieredQueueForecast, newTieredQueueForecast } from "./tiered-queue-forecast.js";

export function summarizeDefaultReplyProposalsForForecast(items: DefaultReplyProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveTieredQueueForecastsFromProposal(items: DefaultReplyProposal[]): TieredQueueForecast[] {
  const out: TieredQueueForecast[] = [];
  for (const item of items) {
    const derived = newTieredQueueForecast(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeTieredQueueForecast(item: TieredQueueForecast): string {
  return normalizeDefaultReplyProposalCode(item.code);
}
