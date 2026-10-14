import * as text from "../../../../kit/text.js";
import { DeflectionRecord } from "./deflection-record.js";

/** How screens and exports show a deflection record. */
export class DeflectionRecordView {
  code: string;
  name: string;
  country: string;
  category: string;
  openRate: string;
  quantity: string;
  windowDays: string;
  discount: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    country: string,
    category: string,
    openRate: string,
    quantity: string,
    windowDays: string,
    discount: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.category = category;
    this.openRate = openRate;
    this.quantity = quantity;
    this.windowDays = windowDays;
    this.discount = discount;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionRecordView(item: DeflectionRecord): DeflectionRecordView {
  return new DeflectionRecordView(
    text.truncate(item.code, 80),
    item.name,
    item.country,
    item.category,
    item.openRate.toFixed(2),
    String(item.quantity),
    String(item.windowDays),
    item.discount.toFixed(2),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionRecordViews(items: DeflectionRecord[]): DeflectionRecordView[] {
  const views: DeflectionRecordView[] = [];
  for (const item of items) {
    views.push(toDeflectionRecordView(item));
  }
  return views;
}

export function sumDeflectionRecordView(view: DeflectionRecordView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedOpenRate + parsedQuantity + parsedWindowDays;
}
