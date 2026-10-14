import * as text from "../../../../kit/text.js";
import { CappedSuppressionProposal } from "./capped-suppression-proposal.js";

/** How screens and exports show a capped suppression proposal. */
export class CappedSuppressionProposalView {
  codeText: string;
  label: string;
  minimum: string;
  bidText: string;
  ceiling: string;
  ownerId: string;
  region: string;
  audienceId: string;
  quantity: string;
  clicks: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    minimum: string,
    bidText: string,
    ceiling: string,
    ownerId: string,
    region: string,
    audienceId: string,
    quantity: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.minimum = minimum;
    this.bidText = bidText;
    this.ceiling = ceiling;
    this.ownerId = ownerId;
    this.region = region;
    this.audienceId = audienceId;
    this.quantity = quantity;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toCappedSuppressionProposalView(item: CappedSuppressionProposal): CappedSuppressionProposalView {
  return new CappedSuppressionProposalView(
    item.code,
    item.label,
    item.minimum.toFixed(2),
    item.bid.toFixed(2),
    item.ceiling.toFixed(2),
    item.ownerId,
    text.truncate(item.region, 80),
    text.truncate(item.audienceId, 80),
    String(item.quantity),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedSuppressionProposalViews(items: CappedSuppressionProposal[]): CappedSuppressionProposalView[] {
  const views: CappedSuppressionProposalView[] = [];
  for (const item of items) {
    views.push(toCappedSuppressionProposalView(item));
  }
  return views;
}

export function sumCappedSuppressionProposalView(view: CappedSuppressionProposalView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedMinimum + parsedBid + parsedCeiling;
}
