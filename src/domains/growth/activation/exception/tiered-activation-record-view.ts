import * as text from "../../../../kit/text.js";
import { TieredActivationRecord } from "./tiered-activation-record.js";

/** How screens and exports show a tiered activation record. */
export class TieredActivationRecordView {
  code: string;
  titleText: string;
  timezone: string;
  bid: string;
  quantityText: string;
  margin: string;
  sourceText: string;
  ownerId: string;
  cohortText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    timezone: string,
    bid: string,
    quantityText: string,
    margin: string,
    sourceText: string,
    ownerId: string,
    cohortText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.timezone = timezone;
    this.bid = bid;
    this.quantityText = quantityText;
    this.margin = margin;
    this.sourceText = sourceText;
    this.ownerId = ownerId;
    this.cohortText = cohortText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredActivationRecordView(item: TieredActivationRecord): TieredActivationRecordView {
  return new TieredActivationRecordView(
    item.code,
    item.title,
    item.timezone,
    item.bid.toFixed(2),
    String(item.quantity),
    item.margin.toFixed(2),
    text.truncate(item.source, 80),
    item.ownerId,
    text.truncate(item.cohort, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredActivationRecordViews(items: TieredActivationRecord[]): TieredActivationRecordView[] {
  const views: TieredActivationRecordView[] = [];
  for (const item of items) {
    views.push(toTieredActivationRecordView(item));
  }
  return views;
}

export function sumTieredActivationRecordView(view: TieredActivationRecordView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedBid + parsedQuantity + parsedMargin;
}
