import * as text from "../../../../kit/text.js";
import { ReplyBatch } from "./reply-batch.js";

/** How screens and exports show a reply batch. */
export class ReplyBatchView {
  code: string;
  label: string;
  ownerId: string;
  rate: string;
  sendAtText: string;
  variantText: string;
  margin: string;
  cohort: string;
  reviewerText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    rate: string,
    sendAtText: string,
    variantText: string,
    margin: string,
    cohort: string,
    reviewerText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.rate = rate;
    this.sendAtText = sendAtText;
    this.variantText = variantText;
    this.margin = margin;
    this.cohort = cohort;
    this.reviewerText = reviewerText;
    this.statusLabel = statusLabel;
  }
}

export function toReplyBatchView(item: ReplyBatch): ReplyBatchView {
  return new ReplyBatchView(
    item.code,
    item.label,
    item.ownerId,
    item.rate.toFixed(2),
    String(item.sendAt),
    text.truncate(item.variant, 40),
    item.margin.toFixed(2),
    item.cohort,
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyBatchViews(items: ReplyBatch[]): ReplyBatchView[] {
  const views: ReplyBatchView[] = [];
  for (const item of items) {
    views.push(toReplyBatchView(item));
  }
  return views;
}

export function sumReplyBatchView(view: ReplyBatchView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedRate + parsedSendAt + parsedMargin;
}
