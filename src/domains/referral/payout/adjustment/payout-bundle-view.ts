import * as text from "../../../../kit/text.js";
import { PayoutBundle } from "./payout-bundle.js";

/** How screens and exports show a payout bundle. */
export class PayoutBundleView {
  codeText: string;
  label: string;
  ratio: string;
  audienceIdText: string;
  visible: string;
  channel: string;
  discount: string;
  ownerId: string;
  rate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    ratio: string,
    audienceIdText: string,
    visible: string,
    channel: string,
    discount: string,
    ownerId: string,
    rate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.ratio = ratio;
    this.audienceIdText = audienceIdText;
    this.visible = visible;
    this.channel = channel;
    this.discount = discount;
    this.ownerId = ownerId;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutBundleView(item: PayoutBundle): PayoutBundleView {
  return new PayoutBundleView(
    item.code,
    text.truncate(item.label, 120),
    item.ratio.toFixed(2),
    item.audienceId,
    `${item.visible}`,
    item.channel,
    item.discount.toFixed(2),
    text.truncate(item.ownerId, 80),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutBundleViews(items: PayoutBundle[]): PayoutBundleView[] {
  const views: PayoutBundleView[] = [];
  for (const item of items) {
    views.push(toPayoutBundleView(item));
  }
  return views;
}

export function sumPayoutBundleView(view: PayoutBundleView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRatio + parsedDiscount + parsedRate;
}
