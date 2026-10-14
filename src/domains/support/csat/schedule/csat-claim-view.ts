import * as text from "../../../../kit/text.js";
import { CsatClaim } from "./csat-claim.js";

/** How screens and exports show a csat claim. */
export class CsatClaimView {
  codeText: string;
  titleText: string;
  threshold: string;
  expiresAt: string;
  discount: string;
  openRateText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    threshold: string,
    expiresAt: string,
    discount: string,
    openRateText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.threshold = threshold;
    this.expiresAt = expiresAt;
    this.discount = discount;
    this.openRateText = openRateText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toCsatClaimView(item: CsatClaim): CsatClaimView {
  return new CsatClaimView(
    item.code,
    text.truncate(item.title, 40),
    item.threshold.toFixed(2),
    String(item.expiresAt),
    item.discount.toFixed(2),
    item.openRate.toFixed(2),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatClaimViews(items: CsatClaim[]): CsatClaimView[] {
  const views: CsatClaimView[] = [];
  for (const item of items) {
    views.push(toCsatClaimView(item));
  }
  return views;
}

export function sumCsatClaimView(view: CsatClaimView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedThreshold + parsedExpiresAt + parsedDiscount;
}
