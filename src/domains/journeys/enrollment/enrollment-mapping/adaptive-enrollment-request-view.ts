import { AdaptiveEnrollmentRequest } from "./adaptive-enrollment-request.js";

/** How screens and exports show a adaptive enrollment request. */
export class AdaptiveEnrollmentRequestView {
  codeText: string;
  name: string;
  graceDays: string;
  source: string;
  quantityText: string;
  minimum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    graceDays: string,
    source: string,
    quantityText: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.graceDays = graceDays;
    this.source = source;
    this.quantityText = quantityText;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveEnrollmentRequestView(item: AdaptiveEnrollmentRequest): AdaptiveEnrollmentRequestView {
  return new AdaptiveEnrollmentRequestView(
    item.code,
    item.name,
    String(item.graceDays),
    item.source,
    String(item.quantity),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveEnrollmentRequestViews(items: AdaptiveEnrollmentRequest[]): AdaptiveEnrollmentRequestView[] {
  const views: AdaptiveEnrollmentRequestView[] = [];
  for (const item of items) {
    views.push(toAdaptiveEnrollmentRequestView(item));
  }
  return views;
}

export function sumAdaptiveEnrollmentRequestView(view: AdaptiveEnrollmentRequestView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedGraceDays + parsedQuantity + parsedMinimum;
}
