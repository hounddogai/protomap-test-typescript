import * as text from "../../../../kit/text.js";
import { CappedFrequencyBaseline } from "./capped-frequency-baseline.js";

/** How screens and exports show a capped frequency baseline. */
export class CappedFrequencyBaselineView {
  code: string;
  nameText: string;
  quantity: string;
  discount: string;
  description: string;
  externalRef: string;
  attempts: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    quantity: string,
    discount: string,
    description: string,
    externalRef: string,
    attempts: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.quantity = quantity;
    this.discount = discount;
    this.description = description;
    this.externalRef = externalRef;
    this.attempts = attempts;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toCappedFrequencyBaselineView(item: CappedFrequencyBaseline): CappedFrequencyBaselineView {
  return new CappedFrequencyBaselineView(
    item.code,
    item.name,
    String(item.quantity),
    item.discount.toFixed(2),
    text.truncate(item.description, 120),
    item.externalRef,
    String(item.attempts),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedFrequencyBaselineViews(items: CappedFrequencyBaseline[]): CappedFrequencyBaselineView[] {
  const views: CappedFrequencyBaselineView[] = [];
  for (const item of items) {
    views.push(toCappedFrequencyBaselineView(item));
  }
  return views;
}

export function sumCappedFrequencyBaselineView(view: CappedFrequencyBaselineView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedQuantity + parsedDiscount + parsedAttempts;
}
