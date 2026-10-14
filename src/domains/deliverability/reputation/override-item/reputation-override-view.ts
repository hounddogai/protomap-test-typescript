import * as text from "../../../../kit/text.js";
import { ReputationOverride } from "./reputation-override.js";

/** How screens and exports show a reputation override. */
export class ReputationOverrideView {
  codeText: string;
  label: string;
  amount: string;
  discount: string;
  graceDays: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    amount: string,
    discount: string,
    graceDays: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.amount = amount;
    this.discount = discount;
    this.graceDays = graceDays;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toReputationOverrideView(item: ReputationOverride): ReputationOverrideView {
  return new ReputationOverrideView(
    item.code,
    text.truncate(item.label, 120),
    item.amount.toFixed(2),
    item.discount.toFixed(2),
    String(item.graceDays),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationOverrideViews(items: ReputationOverride[]): ReputationOverrideView[] {
  const views: ReputationOverrideView[] = [];
  for (const item of items) {
    views.push(toReputationOverrideView(item));
  }
  return views;
}

export function sumReputationOverrideView(view: ReputationOverrideView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedAmount + parsedDiscount + parsedGraceDays;
}
