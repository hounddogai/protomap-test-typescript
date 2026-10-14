import * as text from "../../../../kit/text.js";
import { AdaptiveBounceProposal } from "./adaptive-bounce-proposal.js";

/** How screens and exports show a adaptive bounce proposal. */
export class AdaptiveBounceProposalView {
  code: string;
  title: string;
  budget: string;
  utmSource: string;
  retries: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    budget: string,
    utmSource: string,
    retries: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.utmSource = utmSource;
    this.retries = retries;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveBounceProposalView(item: AdaptiveBounceProposal): AdaptiveBounceProposalView {
  return new AdaptiveBounceProposalView(
    text.truncate(item.code, 64),
    item.title,
    item.budget.toFixed(2),
    item.utmSource,
    String(item.retries),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveBounceProposalViews(items: AdaptiveBounceProposal[]): AdaptiveBounceProposalView[] {
  const views: AdaptiveBounceProposalView[] = [];
  for (const item of items) {
    views.push(toAdaptiveBounceProposalView(item));
  }
  return views;
}

export function sumAdaptiveBounceProposalView(view: AdaptiveBounceProposalView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedBudget + parsedRetries + parsedLimit;
}
