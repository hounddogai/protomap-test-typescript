import * as text from "../../../../kit/text.js";
import { PrimaryWindowPreference } from "./primary-window-preference.js";

/** How screens and exports show a primary window preference. */
export class PrimaryWindowPreferenceView {
  code: string;
  title: string;
  quantity: string;
  currency: string;
  capacity: string;
  checksumText: string;
  startsAt: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    quantity: string,
    currency: string,
    capacity: string,
    checksumText: string,
    startsAt: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.currency = currency;
    this.capacity = capacity;
    this.checksumText = checksumText;
    this.startsAt = startsAt;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryWindowPreferenceView(item: PrimaryWindowPreference): PrimaryWindowPreferenceView {
  return new PrimaryWindowPreferenceView(
    item.code,
    item.title,
    String(item.quantity),
    text.truncate(item.currency, 120),
    String(item.capacity),
    item.checksum,
    String(item.startsAt),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryWindowPreferenceViews(items: PrimaryWindowPreference[]): PrimaryWindowPreferenceView[] {
  const views: PrimaryWindowPreferenceView[] = [];
  for (const item of items) {
    views.push(toPrimaryWindowPreferenceView(item));
  }
  return views;
}

export function sumPrimaryWindowPreferenceView(view: PrimaryWindowPreferenceView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedQuantity + parsedCapacity + parsedStartsAt;
}
