import * as text from "../../../../kit/text.js";
import { PayoutRecord } from "./payout-record.js";

/** How screens and exports show a payout record. */
export class PayoutRecordView {
  code: string;
  title: string;
  frequencyCapText: string;
  batchSize: string;
  timezone: string;
  category: string;
  externalRef: string;
  conversionRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    frequencyCapText: string,
    batchSize: string,
    timezone: string,
    category: string,
    externalRef: string,
    conversionRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCapText = frequencyCapText;
    this.batchSize = batchSize;
    this.timezone = timezone;
    this.category = category;
    this.externalRef = externalRef;
    this.conversionRateText = conversionRateText;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutRecordView(item: PayoutRecord): PayoutRecordView {
  return new PayoutRecordView(
    text.truncate(item.code, 64),
    item.title,
    String(item.frequencyCap),
    String(item.batchSize),
    item.timezone,
    item.category,
    item.externalRef,
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutRecordViews(items: PayoutRecord[]): PayoutRecordView[] {
  const views: PayoutRecordView[] = [];
  for (const item of items) {
    views.push(toPayoutRecordView(item));
  }
  return views;
}

export function sumPayoutRecordView(view: PayoutRecordView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedFrequencyCap + parsedBatchSize + parsedConversionRate;
}
