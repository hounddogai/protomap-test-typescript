import { StrictFrequencyRollup } from "./strict-frequency-rollup.js";

/** How screens and exports show a strict frequency rollup. */
export class StrictFrequencyRollupView {
  code: string;
  label: string;
  currency: string;
  amount: string;
  discount: string;
  limit: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    currency: string,
    amount: string,
    discount: string,
    limit: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.amount = amount;
    this.discount = discount;
    this.limit = limit;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toStrictFrequencyRollupView(item: StrictFrequencyRollup): StrictFrequencyRollupView {
  return new StrictFrequencyRollupView(
    item.code,
    item.label,
    item.currency,
    item.amount.toFixed(2),
    item.discount.toFixed(2),
    String(item.limit),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictFrequencyRollupViews(items: StrictFrequencyRollup[]): StrictFrequencyRollupView[] {
  const views: StrictFrequencyRollupView[] = [];
  for (const item of items) {
    views.push(toStrictFrequencyRollupView(item));
  }
  return views;
}

export function sumStrictFrequencyRollupView(view: StrictFrequencyRollupView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedAmount + parsedDiscount + parsedLimit;
}
