import { CappedPaywallSummary } from "./capped-paywall-summary.js";

/** How screens and exports show a capped paywall summary. */
export class CappedPaywallSummaryView {
  codeText: string;
  name: string;
  maximum: string;
  quantityText: string;
  externalRef: string;
  limit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    maximum: string,
    quantityText: string,
    externalRef: string,
    limit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.maximum = maximum;
    this.quantityText = quantityText;
    this.externalRef = externalRef;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toCappedPaywallSummaryView(item: CappedPaywallSummary): CappedPaywallSummaryView {
  return new CappedPaywallSummaryView(
    item.code,
    item.name,
    item.maximum.toFixed(2),
    String(item.quantity),
    item.externalRef,
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedPaywallSummaryViews(items: CappedPaywallSummary[]): CappedPaywallSummaryView[] {
  const views: CappedPaywallSummaryView[] = [];
  for (const item of items) {
    views.push(toCappedPaywallSummaryView(item));
  }
  return views;
}

export function sumCappedPaywallSummaryView(view: CappedPaywallSummaryView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedMaximum + parsedQuantity + parsedLimit;
}
