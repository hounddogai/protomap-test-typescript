import { ScheduledCreditRequest } from "./scheduled-credit-request.js";

/** How screens and exports show a scheduled credit request. */
export class ScheduledCreditRequestView {
  codeText: string;
  nameText: string;
  maximum: string;
  checksumText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    maximum: string,
    checksumText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.maximum = maximum;
    this.checksumText = checksumText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledCreditRequestView(item: ScheduledCreditRequest): ScheduledCreditRequestView {
  return new ScheduledCreditRequestView(
    item.code,
    item.name,
    item.maximum.toFixed(2),
    item.checksum,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledCreditRequestViews(items: ScheduledCreditRequest[]): ScheduledCreditRequestView[] {
  const views: ScheduledCreditRequestView[] = [];
  for (const item of items) {
    views.push(toScheduledCreditRequestView(item));
  }
  return views;
}

export function sumScheduledCreditRequestView(view: ScheduledCreditRequestView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedMaximum + parsedQuantity;
}
