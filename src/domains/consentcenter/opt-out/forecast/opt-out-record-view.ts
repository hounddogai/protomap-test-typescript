import * as text from "../../../../kit/text.js";
import { OptOutRecord } from "./opt-out-record.js";

/** How screens and exports show a opt out record. */
export class OptOutRecordView {
  code: string;
  name: string;
  clicksText: string;
  quantity: string;
  active: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    clicksText: string,
    quantity: string,
    active: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.clicksText = clicksText;
    this.quantity = quantity;
    this.active = active;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutRecordView(item: OptOutRecord): OptOutRecordView {
  return new OptOutRecordView(
    item.code,
    item.name,
    String(item.clicks),
    String(item.quantity),
    `${item.active}`,
    text.truncate(item.locale, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutRecordViews(items: OptOutRecord[]): OptOutRecordView[] {
  const views: OptOutRecordView[] = [];
  for (const item of items) {
    views.push(toOptOutRecordView(item));
  }
  return views;
}

export function sumOptOutRecordView(view: OptOutRecordView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedClicks + parsedQuantity;
}
