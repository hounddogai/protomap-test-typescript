import * as text from "../../../../kit/text.js";
import { AdaptiveDeflectionWindow } from "./adaptive-deflection-window.js";

/** How screens and exports show a adaptive deflection window. */
export class AdaptiveDeflectionWindowView {
  code: string;
  title: string;
  phone: string;
  costText: string;
  name: string;
  externalRef: string;
  batchSize: string;
  amount: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    phone: string,
    costText: string,
    name: string,
    externalRef: string,
    batchSize: string,
    amount: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.costText = costText;
    this.name = name;
    this.externalRef = externalRef;
    this.batchSize = batchSize;
    this.amount = amount;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveDeflectionWindowView(item: AdaptiveDeflectionWindow): AdaptiveDeflectionWindowView {
  return new AdaptiveDeflectionWindowView(
    item.code,
    item.title,
    item.phone,
    item.cost.toFixed(2),
    item.name,
    text.truncate(item.externalRef, 80),
    String(item.batchSize),
    item.amount.toFixed(2),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveDeflectionWindowViews(items: AdaptiveDeflectionWindow[]): AdaptiveDeflectionWindowView[] {
  const views: AdaptiveDeflectionWindowView[] = [];
  for (const item of items) {
    views.push(toAdaptiveDeflectionWindowView(item));
  }
  return views;
}

export function sumAdaptiveDeflectionWindowView(view: AdaptiveDeflectionWindowView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedCost + parsedBatchSize + parsedAmount;
}
