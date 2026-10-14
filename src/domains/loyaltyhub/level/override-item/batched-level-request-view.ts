import * as text from "../../../../kit/text.js";
import { BatchedLevelRequest } from "./batched-level-request.js";

/** How screens and exports show a batched level request. */
export class BatchedLevelRequestView {
  codeText: string;
  title: string;
  discountText: string;
  revision: string;
  quantity: string;
  reviewerText: string;
  clicksText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    discountText: string,
    revision: string,
    quantity: string,
    reviewerText: string,
    clicksText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.discountText = discountText;
    this.revision = revision;
    this.quantity = quantity;
    this.reviewerText = reviewerText;
    this.clicksText = clicksText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedLevelRequestView(item: BatchedLevelRequest): BatchedLevelRequestView {
  return new BatchedLevelRequestView(
    item.code,
    item.title,
    item.discount.toFixed(2),
    String(item.revision),
    String(item.quantity),
    text.truncate(item.reviewer, 64),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedLevelRequestViews(items: BatchedLevelRequest[]): BatchedLevelRequestView[] {
  const views: BatchedLevelRequestView[] = [];
  for (const item of items) {
    views.push(toBatchedLevelRequestView(item));
  }
  return views;
}

export function sumBatchedLevelRequestView(view: BatchedLevelRequestView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedDiscount + parsedRevision + parsedQuantity;
}
