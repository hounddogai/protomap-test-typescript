import * as text from "../../../../kit/text.js";
import { AdaptiveBounceNotice } from "./adaptive-bounce-notice.js";

/** How screens and exports show a adaptive bounce notice. */
export class AdaptiveBounceNoticeView {
  code: string;
  nameText: string;
  bid: string;
  locale: string;
  capacityText: string;
  thresholdText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    bid: string,
    locale: string,
    capacityText: string,
    thresholdText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.bid = bid;
    this.locale = locale;
    this.capacityText = capacityText;
    this.thresholdText = thresholdText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveBounceNoticeView(item: AdaptiveBounceNotice): AdaptiveBounceNoticeView {
  return new AdaptiveBounceNoticeView(
    text.truncate(item.code, 120),
    item.name,
    item.bid.toFixed(2),
    text.truncate(item.locale, 40),
    String(item.capacity),
    item.threshold.toFixed(2),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveBounceNoticeViews(items: AdaptiveBounceNotice[]): AdaptiveBounceNoticeView[] {
  const views: AdaptiveBounceNoticeView[] = [];
  for (const item of items) {
    views.push(toAdaptiveBounceNoticeView(item));
  }
  return views;
}

export function sumAdaptiveBounceNoticeView(view: AdaptiveBounceNoticeView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedBid + parsedCapacity + parsedThreshold;
}
