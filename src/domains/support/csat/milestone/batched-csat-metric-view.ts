import * as text from "../../../../kit/text.js";
import { BatchedCsatMetric } from "./batched-csat-metric.js";

/** How screens and exports show a batched csat metric. */
export class BatchedCsatMetricView {
  codeText: string;
  title: string;
  currencyText: string;
  discount: string;
  country: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    currencyText: string,
    discount: string,
    country: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.currencyText = currencyText;
    this.discount = discount;
    this.country = country;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedCsatMetricView(item: BatchedCsatMetric): BatchedCsatMetricView {
  return new BatchedCsatMetricView(
    text.truncate(item.code, 64),
    item.title,
    item.currency,
    item.discount.toFixed(2),
    item.country,
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedCsatMetricViews(items: BatchedCsatMetric[]): BatchedCsatMetricView[] {
  const views: BatchedCsatMetricView[] = [];
  for (const item of items) {
    views.push(toBatchedCsatMetricView(item));
  }
  return views;
}

export function sumBatchedCsatMetricView(view: BatchedCsatMetricView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedDiscount;
}
