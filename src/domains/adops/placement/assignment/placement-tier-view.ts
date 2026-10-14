import * as text from "../../../../kit/text.js";
import { PlacementTier } from "./placement-tier.js";

/** How screens and exports show a placement tier. */
export class PlacementTierView {
  code: string;
  name: string;
  description: string;
  amount: string;
  phoneText: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    description: string,
    amount: string,
    phoneText: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.amount = amount;
    this.phoneText = phoneText;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementTierView(item: PlacementTier): PlacementTierView {
  return new PlacementTierView(
    item.code,
    item.name,
    text.truncate(item.description, 80),
    item.amount.toFixed(2),
    item.phone,
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementTierViews(items: PlacementTier[]): PlacementTierView[] {
  const views: PlacementTierView[] = [];
  for (const item of items) {
    views.push(toPlacementTierView(item));
  }
  return views;
}

export function sumPlacementTierView(view: PlacementTierView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedAmount + parsedGraceDays;
}
