import { CappedDeflectionBaseline } from "./capped-deflection-baseline.js";

/** How screens and exports show a capped deflection baseline. */
export class CappedDeflectionBaselineView {
  code: string;
  label: string;
  currency: string;
  discount: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    currency: string,
    discount: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.discount = discount;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedDeflectionBaselineView(item: CappedDeflectionBaseline): CappedDeflectionBaselineView {
  return new CappedDeflectionBaselineView(
    item.code,
    item.label,
    item.currency,
    item.discount.toFixed(2),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedDeflectionBaselineViews(items: CappedDeflectionBaseline[]): CappedDeflectionBaselineView[] {
  const views: CappedDeflectionBaselineView[] = [];
  for (const item of items) {
    views.push(toCappedDeflectionBaselineView(item));
  }
  return views;
}

export function sumCappedDeflectionBaselineView(view: CappedDeflectionBaselineView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedDiscount + parsedOpenRate;
}
