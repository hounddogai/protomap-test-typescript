import * as text from "../../../../kit/text.js";
import { SubscriptionPolicy } from "./subscription-policy.js";

/** How screens and exports show a subscription policy. */
export class SubscriptionPolicyView {
  code: string;
  label: string;
  contactEmailText: string;
  title: string;
  cohort: string;
  quantityText: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    contactEmailText: string,
    title: string,
    cohort: string,
    quantityText: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmailText = contactEmailText;
    this.title = title;
    this.cohort = cohort;
    this.quantityText = quantityText;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionPolicyView(item: SubscriptionPolicy): SubscriptionPolicyView {
  return new SubscriptionPolicyView(
    item.code,
    item.label,
    text.truncate(item.contactEmail, 40),
    item.title,
    item.cohort,
    String(item.quantity),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionPolicyViews(items: SubscriptionPolicy[]): SubscriptionPolicyView[] {
  const views: SubscriptionPolicyView[] = [];
  for (const item of items) {
    views.push(toSubscriptionPolicyView(item));
  }
  return views;
}

export function sumSubscriptionPolicyView(view: SubscriptionPolicyView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
