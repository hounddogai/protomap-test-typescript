import * as text from "../../../../kit/text.js";
import { TouchpointProposal } from "./touchpoint-proposal.js";

/** How screens and exports show a touchpoint proposal. */
export class TouchpointProposalView {
  code: string;
  name: string;
  bid: string;
  channelText: string;
  categoryText: string;
  approvedText: string;
  batchSizeText: string;
  budget: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    bid: string,
    channelText: string,
    categoryText: string,
    approvedText: string,
    batchSizeText: string,
    budget: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.channelText = channelText;
    this.categoryText = categoryText;
    this.approvedText = approvedText;
    this.batchSizeText = batchSizeText;
    this.budget = budget;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointProposalView(item: TouchpointProposal): TouchpointProposalView {
  return new TouchpointProposalView(
    text.truncate(item.code, 64),
    item.name,
    item.bid.toFixed(2),
    item.channel,
    item.category,
    `${item.approved}`,
    String(item.batchSize),
    item.budget.toFixed(2),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointProposalViews(items: TouchpointProposal[]): TouchpointProposalView[] {
  const views: TouchpointProposalView[] = [];
  for (const item of items) {
    views.push(toTouchpointProposalView(item));
  }
  return views;
}

export function sumTouchpointProposalView(view: TouchpointProposalView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBid + parsedBatchSize + parsedBudget;
}
