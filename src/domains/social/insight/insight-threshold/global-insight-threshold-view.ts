import * as text from "../../../../kit/text.js";
import { GlobalInsightThreshold } from "./global-insight-threshold.js";

/** How screens and exports show a global insight threshold. */
export class GlobalInsightThresholdView {
  codeText: string;
  title: string;
  retries: string;
  currency: string;
  discountText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    retries: string,
    currency: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.retries = retries;
    this.currency = currency;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalInsightThresholdView(item: GlobalInsightThreshold): GlobalInsightThresholdView {
  return new GlobalInsightThresholdView(
    item.code,
    text.truncate(item.title, 64),
    String(item.retries),
    text.truncate(item.currency, 40),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalInsightThresholdViews(items: GlobalInsightThreshold[]): GlobalInsightThresholdView[] {
  const views: GlobalInsightThresholdView[] = [];
  for (const item of items) {
    views.push(toGlobalInsightThresholdView(item));
  }
  return views;
}

export function sumGlobalInsightThresholdView(view: GlobalInsightThresholdView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedRetries + parsedDiscount;
}
