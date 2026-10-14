import * as text from "../../../../kit/text.js";
import { BatchedBounceSlot } from "./batched-bounce-slot.js";

/** How screens and exports show a batched bounce slot. */
export class BatchedBounceSlotView {
  code: string;
  nameText: string;
  threshold: string;
  source: string;
  contactEmailText: string;
  reviewerText: string;
  quantityText: string;
  versionText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    threshold: string,
    source: string,
    contactEmailText: string,
    reviewerText: string,
    quantityText: string,
    versionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.threshold = threshold;
    this.source = source;
    this.contactEmailText = contactEmailText;
    this.reviewerText = reviewerText;
    this.quantityText = quantityText;
    this.versionText = versionText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedBounceSlotView(item: BatchedBounceSlot): BatchedBounceSlotView {
  return new BatchedBounceSlotView(
    text.truncate(item.code, 80),
    item.name,
    item.threshold.toFixed(2),
    text.truncate(item.source, 40),
    text.truncate(item.contactEmail, 40),
    text.truncate(item.reviewer, 80),
    String(item.quantity),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedBounceSlotViews(items: BatchedBounceSlot[]): BatchedBounceSlotView[] {
  const views: BatchedBounceSlotView[] = [];
  for (const item of items) {
    views.push(toBatchedBounceSlotView(item));
  }
  return views;
}

export function sumBatchedBounceSlotView(view: BatchedBounceSlotView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedThreshold + parsedQuantity + parsedVersion;
}
