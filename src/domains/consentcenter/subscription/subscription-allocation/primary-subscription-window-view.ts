import { PrimarySubscriptionWindow } from "./primary-subscription-window.js";

/** How screens and exports show a primary subscription window. */
export class PrimarySubscriptionWindowView {
  code: string;
  titleText: string;
  sequenceText: string;
  pinned: string;
  currency: string;
  phoneText: string;
  clicks: string;
  reviewer: string;
  discount: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    sequenceText: string,
    pinned: string,
    currency: string,
    phoneText: string,
    clicks: string,
    reviewer: string,
    discount: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.sequenceText = sequenceText;
    this.pinned = pinned;
    this.currency = currency;
    this.phoneText = phoneText;
    this.clicks = clicks;
    this.reviewer = reviewer;
    this.discount = discount;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toPrimarySubscriptionWindowView(item: PrimarySubscriptionWindow): PrimarySubscriptionWindowView {
  return new PrimarySubscriptionWindowView(
    item.code,
    item.title,
    String(item.sequence),
    `${item.pinned}`,
    item.currency,
    item.phone,
    String(item.clicks),
    item.reviewer,
    item.discount.toFixed(2),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimarySubscriptionWindowViews(items: PrimarySubscriptionWindow[]): PrimarySubscriptionWindowView[] {
  const views: PrimarySubscriptionWindowView[] = [];
  for (const item of items) {
    views.push(toPrimarySubscriptionWindowView(item));
  }
  return views;
}

export function sumPrimarySubscriptionWindowView(view: PrimarySubscriptionWindowView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedSequence + parsedClicks + parsedDiscount;
}
