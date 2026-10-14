import * as text from "../../../../kit/text.js";
import { AdaptiveQueueProposal } from "./adaptive-queue-proposal.js";

/** How screens and exports show a adaptive queue proposal. */
export class AdaptiveQueueProposalView {
  code: string;
  label: string;
  country: string;
  budget: string;
  impressions: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    country: string,
    budget: string,
    impressions: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.budget = budget;
    this.impressions = impressions;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveQueueProposalView(item: AdaptiveQueueProposal): AdaptiveQueueProposalView {
  return new AdaptiveQueueProposalView(
    item.code,
    text.truncate(item.label, 120),
    text.truncate(item.country, 40),
    item.budget.toFixed(2),
    String(item.impressions),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveQueueProposalViews(items: AdaptiveQueueProposal[]): AdaptiveQueueProposalView[] {
  const views: AdaptiveQueueProposalView[] = [];
  for (const item of items) {
    views.push(toAdaptiveQueueProposalView(item));
  }
  return views;
}

export function sumAdaptiveQueueProposalView(view: AdaptiveQueueProposalView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedBudget + parsedImpressions + parsedRate;
}
