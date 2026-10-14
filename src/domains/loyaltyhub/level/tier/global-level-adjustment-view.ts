import * as text from "../../../../kit/text.js";
import { GlobalLevelAdjustment } from "./global-level-adjustment.js";

/** How screens and exports show a global level adjustment. */
export class GlobalLevelAdjustmentView {
  code: string;
  label: string;
  reviewerText: string;
  amountText: string;
  timezone: string;
  quantityText: string;
  capacityText: string;
  source: string;
  revisionText: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    reviewerText: string,
    amountText: string,
    timezone: string,
    quantityText: string,
    capacityText: string,
    source: string,
    revisionText: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.reviewerText = reviewerText;
    this.amountText = amountText;
    this.timezone = timezone;
    this.quantityText = quantityText;
    this.capacityText = capacityText;
    this.source = source;
    this.revisionText = revisionText;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalLevelAdjustmentView(item: GlobalLevelAdjustment): GlobalLevelAdjustmentView {
  return new GlobalLevelAdjustmentView(
    item.code,
    item.label,
    text.truncate(item.reviewer, 64),
    item.amount.toFixed(2),
    item.timezone,
    String(item.quantity),
    String(item.capacity),
    text.truncate(item.source, 120),
    String(item.revision),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalLevelAdjustmentViews(items: GlobalLevelAdjustment[]): GlobalLevelAdjustmentView[] {
  const views: GlobalLevelAdjustmentView[] = [];
  for (const item of items) {
    views.push(toGlobalLevelAdjustmentView(item));
  }
  return views;
}

export function sumGlobalLevelAdjustmentView(view: GlobalLevelAdjustmentView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedAmount + parsedQuantity + parsedCapacity;
}
