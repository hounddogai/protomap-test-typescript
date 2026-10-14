import * as text from "../../../../kit/text.js";
import { BounceSegment } from "./bounce-segment.js";

/** How screens and exports show a bounce segment. */
export class BounceSegmentView {
  code: string;
  name: string;
  quantity: string;
  maximumText: string;
  expiresAt: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    quantity: string,
    maximumText: string,
    expiresAt: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.maximumText = maximumText;
    this.expiresAt = expiresAt;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toBounceSegmentView(item: BounceSegment): BounceSegmentView {
  return new BounceSegmentView(
    item.code,
    text.truncate(item.name, 40),
    String(item.quantity),
    item.maximum.toFixed(2),
    String(item.expiresAt),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceSegmentViews(items: BounceSegment[]): BounceSegmentView[] {
  const views: BounceSegmentView[] = [];
  for (const item of items) {
    views.push(toBounceSegmentView(item));
  }
  return views;
}

export function sumBounceSegmentView(view: BounceSegmentView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedQuantity + parsedMaximum + parsedExpiresAt;
}
