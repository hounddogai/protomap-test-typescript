import * as text from "../../../../kit/text.js";
import { CreditTier } from "./credit-tier.js";

/** How screens and exports show a credit tier. */
export class CreditTierView {
  code: string;
  labelText: string;
  locale: string;
  sourceText: string;
  phoneText: string;
  endsAtText: string;
  segment: string;
  maximumText: string;
  retriesText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    locale: string,
    sourceText: string,
    phoneText: string,
    endsAtText: string,
    segment: string,
    maximumText: string,
    retriesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.locale = locale;
    this.sourceText = sourceText;
    this.phoneText = phoneText;
    this.endsAtText = endsAtText;
    this.segment = segment;
    this.maximumText = maximumText;
    this.retriesText = retriesText;
    this.statusLabel = statusLabel;
  }
}

export function toCreditTierView(item: CreditTier): CreditTierView {
  return new CreditTierView(
    item.code,
    item.label,
    item.locale,
    item.source,
    text.truncate(item.phone, 40),
    String(item.endsAt),
    text.truncate(item.segment, 120),
    item.maximum.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditTierViews(items: CreditTier[]): CreditTierView[] {
  const views: CreditTierView[] = [];
  for (const item of items) {
    views.push(toCreditTierView(item));
  }
  return views;
}

export function sumCreditTierView(view: CreditTierView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedEndsAt + parsedMaximum + parsedRetries;
}
