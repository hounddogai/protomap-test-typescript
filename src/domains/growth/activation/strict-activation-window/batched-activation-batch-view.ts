import * as text from "../../../../kit/text.js";
import { BatchedActivationBatch } from "./batched-activation-batch.js";

/** How screens and exports show a batched activation batch. */
export class BatchedActivationBatchView {
  code: string;
  title: string;
  updatedAt: string;
  country: string;
  category: string;
  discountText: string;
  durationMinutes: string;
  timezoneText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    updatedAt: string,
    country: string,
    category: string,
    discountText: string,
    durationMinutes: string,
    timezoneText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.country = country;
    this.category = category;
    this.discountText = discountText;
    this.durationMinutes = durationMinutes;
    this.timezoneText = timezoneText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedActivationBatchView(item: BatchedActivationBatch): BatchedActivationBatchView {
  return new BatchedActivationBatchView(
    item.code,
    item.title,
    String(item.updatedAt),
    text.truncate(item.country, 80),
    text.truncate(item.category, 80),
    item.discount.toFixed(2),
    String(item.durationMinutes),
    text.truncate(item.timezone, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedActivationBatchViews(items: BatchedActivationBatch[]): BatchedActivationBatchView[] {
  const views: BatchedActivationBatchView[] = [];
  for (const item of items) {
    views.push(toBatchedActivationBatchView(item));
  }
  return views;
}

export function sumBatchedActivationBatchView(view: BatchedActivationBatchView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedUpdatedAt + parsedDiscount + parsedDurationMinutes;
}
