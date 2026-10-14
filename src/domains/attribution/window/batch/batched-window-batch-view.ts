import * as text from "../../../../kit/text.js";
import { BatchedWindowBatch } from "./batched-window-batch.js";

/** How screens and exports show a batched window batch. */
export class BatchedWindowBatchView {
  codeText: string;
  labelText: string;
  discount: string;
  quantityText: string;
  sequenceText: string;
  archived: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    discount: string,
    quantityText: string,
    sequenceText: string,
    archived: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.discount = discount;
    this.quantityText = quantityText;
    this.sequenceText = sequenceText;
    this.archived = archived;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedWindowBatchView(item: BatchedWindowBatch): BatchedWindowBatchView {
  return new BatchedWindowBatchView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 120),
    item.discount.toFixed(2),
    String(item.quantity),
    String(item.sequence),
    `${item.archived}`,
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedWindowBatchViews(items: BatchedWindowBatch[]): BatchedWindowBatchView[] {
  const views: BatchedWindowBatchView[] = [];
  for (const item of items) {
    views.push(toBatchedWindowBatchView(item));
  }
  return views;
}

export function sumBatchedWindowBatchView(view: BatchedWindowBatchView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedDiscount + parsedQuantity + parsedSequence;
}
