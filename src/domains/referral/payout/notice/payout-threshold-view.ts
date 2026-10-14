import * as text from "../../../../kit/text.js";
import { PayoutThreshold } from "./payout-threshold.js";

/** How screens and exports show a payout threshold. */
export class PayoutThresholdView {
  code: string;
  title: string;
  versionText: string;
  name: string;
  rate: string;
  locale: string;
  discount: string;
  ratioText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    versionText: string,
    name: string,
    rate: string,
    locale: string,
    discount: string,
    ratioText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.versionText = versionText;
    this.name = name;
    this.rate = rate;
    this.locale = locale;
    this.discount = discount;
    this.ratioText = ratioText;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutThresholdView(item: PayoutThreshold): PayoutThresholdView {
  return new PayoutThresholdView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 64),
    String(item.version),
    text.truncate(item.name, 64),
    item.rate.toFixed(2),
    item.locale,
    item.discount.toFixed(2),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutThresholdViews(items: PayoutThreshold[]): PayoutThresholdView[] {
  const views: PayoutThresholdView[] = [];
  for (const item of items) {
    views.push(toPayoutThresholdView(item));
  }
  return views;
}

export function sumPayoutThresholdView(view: PayoutThresholdView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedVersion + parsedRate + parsedDiscount;
}
