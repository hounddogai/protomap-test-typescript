import * as text from "../../../../kit/text.js";
import { PayoutTarget } from "./payout-target.js";

/** How screens and exports show a payout target. */
export class PayoutTargetView {
  codeText: string;
  label: string;
  bidText: string;
  sendAt: string;
  region: string;
  priorityText: string;
  batchSizeText: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    bidText: string,
    sendAt: string,
    region: string,
    priorityText: string,
    batchSizeText: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.bidText = bidText;
    this.sendAt = sendAt;
    this.region = region;
    this.priorityText = priorityText;
    this.batchSizeText = batchSizeText;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutTargetView(item: PayoutTarget): PayoutTargetView {
  return new PayoutTargetView(
    item.code,
    text.truncate(item.label, 64),
    item.bid.toFixed(2),
    String(item.sendAt),
    item.region,
    String(item.priority),
    String(item.batchSize),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutTargetViews(items: PayoutTarget[]): PayoutTargetView[] {
  const views: PayoutTargetView[] = [];
  for (const item of items) {
    views.push(toPayoutTargetView(item));
  }
  return views;
}

export function sumPayoutTargetView(view: PayoutTargetView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedBid + parsedSendAt + parsedPriority;
}
