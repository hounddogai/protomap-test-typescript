import * as text from "../../../../kit/text.js";
import { DefaultPayoutTarget } from "./default-payout-target.js";

/** How screens and exports show a default payout target. */
export class DefaultPayoutTargetView {
  code: string;
  name: string;
  discount: string;
  segmentText: string;
  reviewer: string;
  quantity: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    discount: string,
    segmentText: string,
    reviewer: string,
    quantity: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.segmentText = segmentText;
    this.reviewer = reviewer;
    this.quantity = quantity;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPayoutTargetView(item: DefaultPayoutTarget): DefaultPayoutTargetView {
  return new DefaultPayoutTargetView(
    item.code,
    item.name,
    item.discount.toFixed(2),
    text.truncate(item.segment, 80),
    item.reviewer,
    String(item.quantity),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPayoutTargetViews(items: DefaultPayoutTarget[]): DefaultPayoutTargetView[] {
  const views: DefaultPayoutTargetView[] = [];
  for (const item of items) {
    views.push(toDefaultPayoutTargetView(item));
  }
  return views;
}

export function sumDefaultPayoutTargetView(view: DefaultPayoutTargetView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedDiscount + parsedQuantity + parsedOpenRate;
}
