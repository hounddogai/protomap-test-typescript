import * as text from "../../../../kit/text.js";
import { PaywallDigest } from "./paywall-digest.js";

/** How screens and exports show a paywall digest. */
export class PaywallDigestView {
  codeText: string;
  label: string;
  discount: string;
  conversionRate: string;
  batchSizeText: string;
  variant: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    discount: string,
    conversionRate: string,
    batchSizeText: string,
    variant: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.discount = discount;
    this.conversionRate = conversionRate;
    this.batchSizeText = batchSizeText;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallDigestView(item: PaywallDigest): PaywallDigestView {
  return new PaywallDigestView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 80),
    item.discount.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.batchSize),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallDigestViews(items: PaywallDigest[]): PaywallDigestView[] {
  const views: PaywallDigestView[] = [];
  for (const item of items) {
    views.push(toPaywallDigestView(item));
  }
  return views;
}

export function sumPaywallDigestView(view: PaywallDigestView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedDiscount + parsedConversionRate + parsedBatchSize;
}
