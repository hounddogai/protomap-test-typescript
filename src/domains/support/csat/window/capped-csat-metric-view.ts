import * as text from "../../../../kit/text.js";
import { CappedCsatMetric } from "./capped-csat-metric.js";

/** How screens and exports show a capped csat metric. */
export class CappedCsatMetricView {
  codeText: string;
  name: string;
  currency: string;
  rateText: string;
  amount: string;
  weight: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    currency: string,
    rateText: string,
    amount: string,
    weight: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.currency = currency;
    this.rateText = rateText;
    this.amount = amount;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toCappedCsatMetricView(item: CappedCsatMetric): CappedCsatMetricView {
  return new CappedCsatMetricView(
    item.code,
    item.name,
    text.truncate(item.currency, 120),
    item.rate.toFixed(2),
    item.amount.toFixed(2),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedCsatMetricViews(items: CappedCsatMetric[]): CappedCsatMetricView[] {
  const views: CappedCsatMetricView[] = [];
  for (const item of items) {
    views.push(toCappedCsatMetricView(item));
  }
  return views;
}

export function sumCappedCsatMetricView(view: CappedCsatMetricView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedRate + parsedAmount + parsedWeight;
}
