import * as text from "../../../../kit/text.js";
import { ConversionTier } from "./conversion-tier.js";

/** How screens and exports show a conversion tier. */
export class ConversionTierView {
  code: string;
  title: string;
  currency: string;
  budget: string;
  visible: string;
  utmSourceText: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    currency: string,
    budget: string,
    visible: string,
    utmSourceText: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.budget = budget;
    this.visible = visible;
    this.utmSourceText = utmSourceText;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toConversionTierView(item: ConversionTier): ConversionTierView {
  return new ConversionTierView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 64),
    text.truncate(item.currency, 80),
    item.budget.toFixed(2),
    `${item.visible}`,
    text.truncate(item.utmSource, 120),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionTierViews(items: ConversionTier[]): ConversionTierView[] {
  const views: ConversionTierView[] = [];
  for (const item of items) {
    views.push(toConversionTierView(item));
  }
  return views;
}

export function sumConversionTierView(view: ConversionTierView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedBudget + parsedAmount;
}
