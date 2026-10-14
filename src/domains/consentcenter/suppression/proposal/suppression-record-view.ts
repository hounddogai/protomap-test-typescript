import * as text from "../../../../kit/text.js";
import { SuppressionRecord } from "./suppression-record.js";

/** How screens and exports show a suppression record. */
export class SuppressionRecordView {
  code: string;
  titleText: string;
  currency: string;
  archived: string;
  pinned: string;
  journeyIdText: string;
  ownerId: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    currency: string,
    archived: string,
    pinned: string,
    journeyIdText: string,
    ownerId: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.currency = currency;
    this.archived = archived;
    this.pinned = pinned;
    this.journeyIdText = journeyIdText;
    this.ownerId = ownerId;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionRecordView(item: SuppressionRecord): SuppressionRecordView {
  return new SuppressionRecordView(
    item.code,
    item.title,
    item.currency,
    `${item.archived}`,
    `${item.pinned}`,
    text.truncate(item.journeyId, 40),
    item.ownerId,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionRecordViews(items: SuppressionRecord[]): SuppressionRecordView[] {
  const views: SuppressionRecordView[] = [];
  for (const item of items) {
    views.push(toSuppressionRecordView(item));
  }
  return views;
}

export function sumSuppressionRecordView(view: SuppressionRecordView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
