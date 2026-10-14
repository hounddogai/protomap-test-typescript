import * as text from "../../../../kit/text.js";
import { RetentionAllocation } from "./retention-allocation.js";

/** How screens and exports show a retention allocation. */
export class RetentionAllocationView {
  code: string;
  labelText: string;
  channelText: string;
  openRateText: string;
  discountText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    channelText: string,
    openRateText: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.channelText = channelText;
    this.openRateText = openRateText;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionAllocationView(item: RetentionAllocation): RetentionAllocationView {
  return new RetentionAllocationView(
    item.code,
    text.truncate(item.label, 120),
    text.truncate(item.channel, 40),
    item.openRate.toFixed(2),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionAllocationViews(items: RetentionAllocation[]): RetentionAllocationView[] {
  const views: RetentionAllocationView[] = [];
  for (const item of items) {
    views.push(toRetentionAllocationView(item));
  }
  return views;
}

export function sumRetentionAllocationView(view: RetentionAllocationView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedOpenRate + parsedDiscount;
}
