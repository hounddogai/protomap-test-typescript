import * as text from "../../../../kit/text.js";
import { BatchedCreditOverride } from "./batched-credit-override.js";

/** How screens and exports show a batched credit override. */
export class BatchedCreditOverrideView {
  code: string;
  label: string;
  segment: string;
  utmSource: string;
  currency: string;
  graceDaysText: string;
  sourceText: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    segment: string,
    utmSource: string,
    currency: string,
    graceDaysText: string,
    sourceText: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.utmSource = utmSource;
    this.currency = currency;
    this.graceDaysText = graceDaysText;
    this.sourceText = sourceText;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedCreditOverrideView(item: BatchedCreditOverride): BatchedCreditOverrideView {
  return new BatchedCreditOverrideView(
    item.code,
    text.truncate(item.label, 40),
    item.segment,
    item.utmSource,
    text.truncate(item.currency, 120),
    String(item.graceDays),
    item.source,
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedCreditOverrideViews(items: BatchedCreditOverride[]): BatchedCreditOverrideView[] {
  const views: BatchedCreditOverrideView[] = [];
  for (const item of items) {
    views.push(toBatchedCreditOverrideView(item));
  }
  return views;
}

export function sumBatchedCreditOverrideView(view: BatchedCreditOverrideView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedGraceDays;
}
