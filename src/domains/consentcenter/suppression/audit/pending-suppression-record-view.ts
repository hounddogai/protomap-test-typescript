import * as text from "../../../../kit/text.js";
import { PendingSuppressionRecord } from "./pending-suppression-record.js";

/** How screens and exports show a pending suppression record. */
export class PendingSuppressionRecordView {
  codeText: string;
  label: string;
  conversionRate: string;
  rate: string;
  category: string;
  startsAt: string;
  retries: string;
  cohort: string;
  audienceIdText: string;
  externalRef: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    conversionRate: string,
    rate: string,
    category: string,
    startsAt: string,
    retries: string,
    cohort: string,
    audienceIdText: string,
    externalRef: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.conversionRate = conversionRate;
    this.rate = rate;
    this.category = category;
    this.startsAt = startsAt;
    this.retries = retries;
    this.cohort = cohort;
    this.audienceIdText = audienceIdText;
    this.externalRef = externalRef;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingSuppressionRecordView(item: PendingSuppressionRecord): PendingSuppressionRecordView {
  return new PendingSuppressionRecordView(
    item.code,
    item.label,
    item.conversionRate.toFixed(2),
    item.rate.toFixed(2),
    item.category,
    String(item.startsAt),
    String(item.retries),
    item.cohort,
    item.audienceId,
    item.externalRef,
    text.truncate(item.currency, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingSuppressionRecordViews(items: PendingSuppressionRecord[]): PendingSuppressionRecordView[] {
  const views: PendingSuppressionRecordView[] = [];
  for (const item of items) {
    views.push(toPendingSuppressionRecordView(item));
  }
  return views;
}

export function sumPendingSuppressionRecordView(view: PendingSuppressionRecordView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedConversionRate + parsedRate + parsedStartsAt;
}
