import * as text from "../../../../kit/text.js";
import { InsightBatch } from "./insight-batch.js";

/** How screens and exports show a insight batch. */
export class InsightBatchView {
  code: string;
  name: string;
  conversionRate: string;
  createdAt: string;
  amount: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    conversionRate: string,
    createdAt: string,
    amount: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.createdAt = createdAt;
    this.amount = amount;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toInsightBatchView(item: InsightBatch): InsightBatchView {
  return new InsightBatchView(
    text.truncate(item.code, 40),
    item.name,
    item.conversionRate.toFixed(2),
    String(item.createdAt),
    item.amount.toFixed(2),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightBatchViews(items: InsightBatch[]): InsightBatchView[] {
  const views: InsightBatchView[] = [];
  for (const item of items) {
    views.push(toInsightBatchView(item));
  }
  return views;
}

export function sumInsightBatchView(view: InsightBatchView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedConversionRate + parsedCreatedAt + parsedAmount;
}
