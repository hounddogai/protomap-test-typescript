import * as text from "../../../../kit/text.js";
import { CreditSlot } from "./credit-slot.js";

/** How screens and exports show a credit slot. */
export class CreditSlotView {
  code: string;
  title: string;
  openRate: string;
  maximum: string;
  quantity: string;
  phone: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    openRate: string,
    maximum: string,
    quantity: string,
    phone: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.maximum = maximum;
    this.quantity = quantity;
    this.phone = phone;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toCreditSlotView(item: CreditSlot): CreditSlotView {
  return new CreditSlotView(
    text.truncate(item.code, 64),
    item.title,
    item.openRate.toFixed(2),
    item.maximum.toFixed(2),
    String(item.quantity),
    item.phone,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditSlotViews(items: CreditSlot[]): CreditSlotView[] {
  const views: CreditSlotView[] = [];
  for (const item of items) {
    views.push(toCreditSlotView(item));
  }
  return views;
}

export function sumCreditSlotView(view: CreditSlotView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedOpenRate + parsedMaximum + parsedQuantity;
}
