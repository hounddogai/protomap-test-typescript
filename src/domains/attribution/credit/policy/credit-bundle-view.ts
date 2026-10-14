import * as text from "../../../../kit/text.js";
import { CreditBundle } from "./credit-bundle.js";

/** How screens and exports show a credit bundle. */
export class CreditBundleView {
  codeText: string;
  titleText: string;
  capacity: string;
  source: string;
  locale: string;
  amount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    capacity: string,
    source: string,
    locale: string,
    amount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.capacity = capacity;
    this.source = source;
    this.locale = locale;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toCreditBundleView(item: CreditBundle): CreditBundleView {
  return new CreditBundleView(
    item.code,
    item.title,
    String(item.capacity),
    item.source,
    text.truncate(item.locale, 40),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditBundleViews(items: CreditBundle[]): CreditBundleView[] {
  const views: CreditBundleView[] = [];
  for (const item of items) {
    views.push(toCreditBundleView(item));
  }
  return views;
}

export function sumCreditBundleView(view: CreditBundleView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedCapacity + parsedAmount;
}
