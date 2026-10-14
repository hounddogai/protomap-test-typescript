import * as text from "../../../../kit/text.js";
import { GlobalModelRequest } from "./global-model-request.js";

/** How screens and exports show a global model request. */
export class GlobalModelRequestView {
  code: string;
  labelText: string;
  quantity: string;
  country: string;
  amount: string;
  currency: string;
  threshold: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    quantity: string,
    country: string,
    amount: string,
    currency: string,
    threshold: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.quantity = quantity;
    this.country = country;
    this.amount = amount;
    this.currency = currency;
    this.threshold = threshold;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalModelRequestView(item: GlobalModelRequest): GlobalModelRequestView {
  return new GlobalModelRequestView(
    text.truncate(item.code, 120),
    item.label,
    String(item.quantity),
    item.country,
    item.amount.toFixed(2),
    item.currency,
    item.threshold.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalModelRequestViews(items: GlobalModelRequest[]): GlobalModelRequestView[] {
  const views: GlobalModelRequestView[] = [];
  for (const item of items) {
    views.push(toGlobalModelRequestView(item));
  }
  return views;
}

export function sumGlobalModelRequestView(view: GlobalModelRequestView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedQuantity + parsedAmount + parsedThreshold;
}
