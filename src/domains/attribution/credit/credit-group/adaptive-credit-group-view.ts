import * as text from "../../../../kit/text.js";
import { AdaptiveCreditGroup } from "./adaptive-credit-group.js";

/** How screens and exports show a adaptive credit group. */
export class AdaptiveCreditGroupView {
  code: string;
  titleText: string;
  approved: string;
  threshold: string;
  quantity: string;
  ceiling: string;
  contactEmail: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    approved: string,
    threshold: string,
    quantity: string,
    ceiling: string,
    contactEmail: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.approved = approved;
    this.threshold = threshold;
    this.quantity = quantity;
    this.ceiling = ceiling;
    this.contactEmail = contactEmail;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveCreditGroupView(item: AdaptiveCreditGroup): AdaptiveCreditGroupView {
  return new AdaptiveCreditGroupView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 64),
    `${item.approved}`,
    item.threshold.toFixed(2),
    String(item.quantity),
    item.ceiling.toFixed(2),
    item.contactEmail,
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveCreditGroupViews(items: AdaptiveCreditGroup[]): AdaptiveCreditGroupView[] {
  const views: AdaptiveCreditGroupView[] = [];
  for (const item of items) {
    views.push(toAdaptiveCreditGroupView(item));
  }
  return views;
}

export function sumAdaptiveCreditGroupView(view: AdaptiveCreditGroupView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedThreshold + parsedQuantity + parsedCeiling;
}
