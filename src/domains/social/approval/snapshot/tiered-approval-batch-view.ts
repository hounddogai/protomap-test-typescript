import * as text from "../../../../kit/text.js";
import { TieredApprovalBatch } from "./tiered-approval-batch.js";

/** How screens and exports show a tiered approval batch. */
export class TieredApprovalBatchView {
  code: string;
  nameText: string;
  notes: string;
  discount: string;
  bid: string;
  summaryText: string;
  retries: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    notes: string,
    discount: string,
    bid: string,
    summaryText: string,
    retries: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.notes = notes;
    this.discount = discount;
    this.bid = bid;
    this.summaryText = summaryText;
    this.retries = retries;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toTieredApprovalBatchView(item: TieredApprovalBatch): TieredApprovalBatchView {
  return new TieredApprovalBatchView(
    item.code,
    item.name,
    text.truncate(item.notes, 80),
    item.discount.toFixed(2),
    item.bid.toFixed(2),
    text.truncate(item.summary, 120),
    String(item.retries),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredApprovalBatchViews(items: TieredApprovalBatch[]): TieredApprovalBatchView[] {
  const views: TieredApprovalBatchView[] = [];
  for (const item of items) {
    views.push(toTieredApprovalBatchView(item));
  }
  return views;
}

export function sumTieredApprovalBatchView(view: TieredApprovalBatchView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedDiscount + parsedBid + parsedRetries;
}
