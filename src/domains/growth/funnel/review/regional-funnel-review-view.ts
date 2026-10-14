import * as text from "../../../../kit/text.js";
import { RegionalFunnelReview } from "./regional-funnel-review.js";

/** How screens and exports show a regional funnel review. */
export class RegionalFunnelReviewView {
  code: string;
  titleText: string;
  channel: string;
  contactEmail: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    channel: string,
    contactEmail: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.channel = channel;
    this.contactEmail = contactEmail;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalFunnelReviewView(item: RegionalFunnelReview): RegionalFunnelReviewView {
  return new RegionalFunnelReviewView(
    item.code,
    item.title,
    text.truncate(item.channel, 80),
    item.contactEmail,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalFunnelReviewViews(items: RegionalFunnelReview[]): RegionalFunnelReviewView[] {
  const views: RegionalFunnelReviewView[] = [];
  for (const item of items) {
    views.push(toRegionalFunnelReviewView(item));
  }
  return views;
}

export function sumRegionalFunnelReviewView(view: RegionalFunnelReviewView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedBid;
}
