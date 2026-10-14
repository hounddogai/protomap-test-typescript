import * as text from "../../../../kit/text.js";
import { FraudCheckWindow } from "./fraud-check-window.js";

/** How screens and exports show a fraud check window. */
export class FraudCheckWindowView {
  code: string;
  name: string;
  quantity: string;
  updatedAtText: string;
  priorityText: string;
  campaignRef: string;
  conversionRate: string;
  maximum: string;
  ratio: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    quantity: string,
    updatedAtText: string,
    priorityText: string,
    campaignRef: string,
    conversionRate: string,
    maximum: string,
    ratio: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.updatedAtText = updatedAtText;
    this.priorityText = priorityText;
    this.campaignRef = campaignRef;
    this.conversionRate = conversionRate;
    this.maximum = maximum;
    this.ratio = ratio;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckWindowView(item: FraudCheckWindow): FraudCheckWindowView {
  return new FraudCheckWindowView(
    item.code,
    text.truncate(item.name, 120),
    String(item.quantity),
    String(item.updatedAt),
    String(item.priority),
    text.truncate(item.campaignRef, 64),
    item.conversionRate.toFixed(2),
    item.maximum.toFixed(2),
    item.ratio.toFixed(2),
    text.truncate(item.phone, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckWindowViews(items: FraudCheckWindow[]): FraudCheckWindowView[] {
  const views: FraudCheckWindowView[] = [];
  for (const item of items) {
    views.push(toFraudCheckWindowView(item));
  }
  return views;
}

export function sumFraudCheckWindowView(view: FraudCheckWindowView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedQuantity + parsedUpdatedAt + parsedPriority;
}
