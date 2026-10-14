import * as text from "../../../../kit/text.js";
import { SlaWindow } from "./sla-window.js";

/** How screens and exports show a sla window. */
export class SlaWindowView {
  code: string;
  label: string;
  bidText: string;
  maximum: string;
  clicksText: string;
  expiresAt: string;
  reviewerText: string;
  endsAt: string;
  score: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    bidText: string,
    maximum: string,
    clicksText: string,
    expiresAt: string,
    reviewerText: string,
    endsAt: string,
    score: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.bidText = bidText;
    this.maximum = maximum;
    this.clicksText = clicksText;
    this.expiresAt = expiresAt;
    this.reviewerText = reviewerText;
    this.endsAt = endsAt;
    this.score = score;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toSlaWindowView(item: SlaWindow): SlaWindowView {
  return new SlaWindowView(
    text.truncate(item.code, 80),
    item.label,
    item.bid.toFixed(2),
    item.maximum.toFixed(2),
    String(item.clicks),
    String(item.expiresAt),
    item.reviewer,
    String(item.endsAt),
    item.score.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaWindowViews(items: SlaWindow[]): SlaWindowView[] {
  const views: SlaWindowView[] = [];
  for (const item of items) {
    views.push(toSlaWindowView(item));
  }
  return views;
}

export function sumSlaWindowView(view: SlaWindowView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedBid + parsedMaximum + parsedClicks;
}
