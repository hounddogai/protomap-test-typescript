import * as text from "../../../../kit/text.js";
import { QueueBatch } from "./queue-batch.js";

/** How screens and exports show a queue batch. */
export class QueueBatchView {
  codeText: string;
  label: string;
  sourceText: string;
  timezone: string;
  audienceId: string;
  quantity: string;
  bid: string;
  discount: string;
  weight: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    sourceText: string,
    timezone: string,
    audienceId: string,
    quantity: string,
    bid: string,
    discount: string,
    weight: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.sourceText = sourceText;
    this.timezone = timezone;
    this.audienceId = audienceId;
    this.quantity = quantity;
    this.bid = bid;
    this.discount = discount;
    this.weight = weight;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toQueueBatchView(item: QueueBatch): QueueBatchView {
  return new QueueBatchView(
    item.code,
    item.label,
    item.source,
    item.timezone,
    item.audienceId,
    String(item.quantity),
    item.bid.toFixed(2),
    item.discount.toFixed(2),
    item.weight.toFixed(2),
    text.truncate(item.summary, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueBatchViews(items: QueueBatch[]): QueueBatchView[] {
  const views: QueueBatchView[] = [];
  for (const item of items) {
    views.push(toQueueBatchView(item));
  }
  return views;
}

export function sumQueueBatchView(view: QueueBatchView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedQuantity + parsedBid + parsedDiscount;
}
