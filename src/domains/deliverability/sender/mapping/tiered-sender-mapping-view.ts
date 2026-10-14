import { TieredSenderMapping } from "./tiered-sender-mapping.js";

/** How screens and exports show a tiered sender mapping. */
export class TieredSenderMappingView {
  code: string;
  name: string;
  ownerId: string;
  maximumText: string;
  amount: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    maximumText: string,
    amount: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.maximumText = maximumText;
    this.amount = amount;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toTieredSenderMappingView(item: TieredSenderMapping): TieredSenderMappingView {
  return new TieredSenderMappingView(
    item.code,
    item.name,
    item.ownerId,
    item.maximum.toFixed(2),
    item.amount.toFixed(2),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredSenderMappingViews(items: TieredSenderMapping[]): TieredSenderMappingView[] {
  const views: TieredSenderMappingView[] = [];
  for (const item of items) {
    views.push(toTieredSenderMappingView(item));
  }
  return views;
}

export function sumTieredSenderMappingView(view: TieredSenderMappingView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedMaximum + parsedAmount + parsedDiscount;
}
