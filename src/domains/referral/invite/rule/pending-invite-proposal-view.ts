import * as text from "../../../../kit/text.js";
import { PendingInviteProposal } from "./pending-invite-proposal.js";

/** How screens and exports show a pending invite proposal. */
export class PendingInviteProposalView {
  codeText: string;
  titleText: string;
  impressions: string;
  bid: string;
  reviewer: string;
  conversionRate: string;
  minimumText: string;
  clicks: string;
  pinned: string;
  category: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    impressions: string,
    bid: string,
    reviewer: string,
    conversionRate: string,
    minimumText: string,
    clicks: string,
    pinned: string,
    category: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.impressions = impressions;
    this.bid = bid;
    this.reviewer = reviewer;
    this.conversionRate = conversionRate;
    this.minimumText = minimumText;
    this.clicks = clicks;
    this.pinned = pinned;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toPendingInviteProposalView(item: PendingInviteProposal): PendingInviteProposalView {
  return new PendingInviteProposalView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 120),
    String(item.impressions),
    item.bid.toFixed(2),
    text.truncate(item.reviewer, 64),
    item.conversionRate.toFixed(2),
    item.minimum.toFixed(2),
    String(item.clicks),
    `${item.pinned}`,
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingInviteProposalViews(items: PendingInviteProposal[]): PendingInviteProposalView[] {
  const views: PendingInviteProposalView[] = [];
  for (const item of items) {
    views.push(toPendingInviteProposalView(item));
  }
  return views;
}

export function sumPendingInviteProposalView(view: PendingInviteProposalView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedImpressions + parsedBid + parsedConversionRate;
}
