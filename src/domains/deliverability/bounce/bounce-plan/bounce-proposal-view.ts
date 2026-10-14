import * as text from "../../../../kit/text.js";
import { BounceProposal } from "./bounce-proposal.js";

/** How screens and exports show a bounce proposal. */
export class BounceProposalView {
  code: string;
  labelText: string;
  limit: string;
  rate: string;
  bid: string;
  categoryText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    limit: string,
    rate: string,
    bid: string,
    categoryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.limit = limit;
    this.rate = rate;
    this.bid = bid;
    this.categoryText = categoryText;
    this.statusLabel = statusLabel;
  }
}

export function toBounceProposalView(item: BounceProposal): BounceProposalView {
  return new BounceProposalView(
    item.code,
    item.label,
    String(item.limit),
    item.rate.toFixed(2),
    item.bid.toFixed(2),
    text.truncate(item.category, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceProposalViews(items: BounceProposal[]): BounceProposalView[] {
  const views: BounceProposalView[] = [];
  for (const item of items) {
    views.push(toBounceProposalView(item));
  }
  return views;
}

export function sumBounceProposalView(view: BounceProposalView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedLimit + parsedRate + parsedBid;
}
