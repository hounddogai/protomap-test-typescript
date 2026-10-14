import * as text from "../../../../kit/text.js";
import { PaywallBaseline } from "./paywall-baseline.js";

/** How screens and exports show a paywall baseline. */
export class PaywallBaselineView {
  codeText: string;
  labelText: string;
  ceiling: string;
  archived: string;
  quantityText: string;
  minimum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    ceiling: string,
    archived: string,
    quantityText: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.ceiling = ceiling;
    this.archived = archived;
    this.quantityText = quantityText;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallBaselineView(item: PaywallBaseline): PaywallBaselineView {
  return new PaywallBaselineView(
    item.code,
    text.truncate(item.label, 64),
    item.ceiling.toFixed(2),
    `${item.archived}`,
    String(item.quantity),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallBaselineViews(items: PaywallBaseline[]): PaywallBaselineView[] {
  const views: PaywallBaselineView[] = [];
  for (const item of items) {
    views.push(toPaywallBaselineView(item));
  }
  return views;
}

export function sumPaywallBaselineView(view: PaywallBaselineView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedCeiling + parsedQuantity + parsedMinimum;
}
