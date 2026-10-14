import * as text from "../../../../kit/text.js";
import { FunnelReview } from "./funnel-review.js";

/** How screens and exports show a funnel review. */
export class FunnelReviewView {
  code: string;
  name: string;
  startsAt: string;
  currency: string;
  title: string;
  locale: string;
  createdAtText: string;
  bidText: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    startsAt: string,
    currency: string,
    title: string,
    locale: string,
    createdAtText: string,
    bidText: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.currency = currency;
    this.title = title;
    this.locale = locale;
    this.createdAtText = createdAtText;
    this.bidText = bidText;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelReviewView(item: FunnelReview): FunnelReviewView {
  return new FunnelReviewView(
    item.code,
    text.truncate(item.name, 40),
    String(item.startsAt),
    item.currency,
    item.title,
    text.truncate(item.locale, 120),
    String(item.createdAt),
    item.bid.toFixed(2),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelReviewViews(items: FunnelReview[]): FunnelReviewView[] {
  const views: FunnelReviewView[] = [];
  for (const item of items) {
    views.push(toFunnelReviewView(item));
  }
  return views;
}

export function sumFunnelReviewView(view: FunnelReviewView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedStartsAt + parsedCreatedAt + parsedBid;
}
