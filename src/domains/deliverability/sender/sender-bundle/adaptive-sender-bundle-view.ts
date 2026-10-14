import * as text from "../../../../kit/text.js";
import { AdaptiveSenderBundle } from "./adaptive-sender-bundle.js";

/** How screens and exports show a adaptive sender bundle. */
export class AdaptiveSenderBundleView {
  code: string;
  label: string;
  channel: string;
  quantity: string;
  campaignRef: string;
  capacity: string;
  discount: string;
  locale: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channel: string,
    quantity: string,
    campaignRef: string,
    capacity: string,
    discount: string,
    locale: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.quantity = quantity;
    this.campaignRef = campaignRef;
    this.capacity = capacity;
    this.discount = discount;
    this.locale = locale;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveSenderBundleView(item: AdaptiveSenderBundle): AdaptiveSenderBundleView {
  return new AdaptiveSenderBundleView(
    text.truncate(item.code, 120),
    item.label,
    item.channel,
    String(item.quantity),
    item.campaignRef,
    String(item.capacity),
    item.discount.toFixed(2),
    item.locale,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveSenderBundleViews(items: AdaptiveSenderBundle[]): AdaptiveSenderBundleView[] {
  const views: AdaptiveSenderBundleView[] = [];
  for (const item of items) {
    views.push(toAdaptiveSenderBundleView(item));
  }
  return views;
}

export function sumAdaptiveSenderBundleView(view: AdaptiveSenderBundleView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedQuantity + parsedCapacity + parsedDiscount;
}
