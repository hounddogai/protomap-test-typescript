import * as text from "../../../../kit/text.js";
import { LegacySubscriptionRecord } from "./legacy-subscription-record.js";

/** How screens and exports show a legacy subscription record. */
export class LegacySubscriptionRecordView {
  code: string;
  titleText: string;
  expiresAt: string;
  rateText: string;
  utmSource: string;
  amount: string;
  floorValueText: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    expiresAt: string,
    rateText: string,
    utmSource: string,
    amount: string,
    floorValueText: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.expiresAt = expiresAt;
    this.rateText = rateText;
    this.utmSource = utmSource;
    this.amount = amount;
    this.floorValueText = floorValueText;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toLegacySubscriptionRecordView(item: LegacySubscriptionRecord): LegacySubscriptionRecordView {
  return new LegacySubscriptionRecordView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 80),
    String(item.expiresAt),
    item.rate.toFixed(2),
    text.truncate(item.utmSource, 120),
    item.amount.toFixed(2),
    item.floorValue.toFixed(2),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacySubscriptionRecordViews(items: LegacySubscriptionRecord[]): LegacySubscriptionRecordView[] {
  const views: LegacySubscriptionRecordView[] = [];
  for (const item of items) {
    views.push(toLegacySubscriptionRecordView(item));
  }
  return views;
}

export function sumLegacySubscriptionRecordView(view: LegacySubscriptionRecordView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedExpiresAt + parsedRate + parsedAmount;
}
