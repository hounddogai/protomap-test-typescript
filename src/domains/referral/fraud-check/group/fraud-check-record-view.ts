import * as text from "../../../../kit/text.js";
import { FraudCheckRecord } from "./fraud-check-record.js";

/** How screens and exports show a fraud check record. */
export class FraudCheckRecordView {
  code: string;
  titleText: string;
  openRateText: string;
  locale: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    openRateText: string,
    locale: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.openRateText = openRateText;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckRecordView(item: FraudCheckRecord): FraudCheckRecordView {
  return new FraudCheckRecordView(
    text.truncate(item.code, 120),
    item.title,
    item.openRate.toFixed(2),
    item.locale,
    text.truncate(item.campaignRef, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckRecordViews(items: FraudCheckRecord[]): FraudCheckRecordView[] {
  const views: FraudCheckRecordView[] = [];
  for (const item of items) {
    views.push(toFraudCheckRecordView(item));
  }
  return views;
}

export function sumFraudCheckRecordView(view: FraudCheckRecordView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedOpenRate;
}
