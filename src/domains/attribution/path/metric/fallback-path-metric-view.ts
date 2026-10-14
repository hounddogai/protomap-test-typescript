import { FallbackPathMetric } from "./fallback-path-metric.js";

/** How screens and exports show a fallback path metric. */
export class FallbackPathMetricView {
  code: string;
  label: string;
  quantityText: string;
  capacity: string;
  amount: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    quantityText: string,
    capacity: string,
    amount: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.quantityText = quantityText;
    this.capacity = capacity;
    this.amount = amount;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackPathMetricView(item: FallbackPathMetric): FallbackPathMetricView {
  return new FallbackPathMetricView(
    item.code,
    item.label,
    String(item.quantity),
    String(item.capacity),
    item.amount.toFixed(2),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackPathMetricViews(items: FallbackPathMetric[]): FallbackPathMetricView[] {
  const views: FallbackPathMetricView[] = [];
  for (const item of items) {
    views.push(toFallbackPathMetricView(item));
  }
  return views;
}

export function sumFallbackPathMetricView(view: FallbackPathMetricView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedQuantity + parsedCapacity + parsedAmount;
}
