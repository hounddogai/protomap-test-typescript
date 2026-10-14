import * as text from "../../../../kit/text.js";
import { TieredConversionRecord } from "./tiered-conversion-record.js";

/** How screens and exports show a tiered conversion record. */
export class TieredConversionRecordView {
  code: string;
  name: string;
  sendAtText: string;
  endsAt: string;
  segment: string;
  approved: string;
  contactEmailText: string;
  summaryText: string;
  updatedAtText: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    sendAtText: string,
    endsAt: string,
    segment: string,
    approved: string,
    contactEmailText: string,
    summaryText: string,
    updatedAtText: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.sendAtText = sendAtText;
    this.endsAt = endsAt;
    this.segment = segment;
    this.approved = approved;
    this.contactEmailText = contactEmailText;
    this.summaryText = summaryText;
    this.updatedAtText = updatedAtText;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredConversionRecordView(item: TieredConversionRecord): TieredConversionRecordView {
  return new TieredConversionRecordView(
    item.code,
    item.name,
    String(item.sendAt),
    String(item.endsAt),
    text.truncate(item.segment, 80),
    `${item.approved}`,
    item.contactEmail,
    item.summary,
    String(item.updatedAt),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredConversionRecordViews(items: TieredConversionRecord[]): TieredConversionRecordView[] {
  const views: TieredConversionRecordView[] = [];
  for (const item of items) {
    views.push(toTieredConversionRecordView(item));
  }
  return views;
}

export function sumTieredConversionRecordView(view: TieredConversionRecordView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedSendAt + parsedEndsAt + parsedUpdatedAt;
}
