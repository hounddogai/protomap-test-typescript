import * as text from "../../../../kit/text.js";
import { DefaultWaitTarget } from "./default-wait-target.js";

/** How screens and exports show a default wait target. */
export class DefaultWaitTargetView {
  codeText: string;
  labelText: string;
  contactEmailText: string;
  country: string;
  nameText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    contactEmailText: string,
    country: string,
    nameText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.contactEmailText = contactEmailText;
    this.country = country;
    this.nameText = nameText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultWaitTargetView(item: DefaultWaitTarget): DefaultWaitTargetView {
  return new DefaultWaitTargetView(
    text.truncate(item.code, 40),
    item.label,
    text.truncate(item.contactEmail, 120),
    text.truncate(item.country, 120),
    item.name,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultWaitTargetViews(items: DefaultWaitTarget[]): DefaultWaitTargetView[] {
  const views: DefaultWaitTargetView[] = [];
  for (const item of items) {
    views.push(toDefaultWaitTargetView(item));
  }
  return views;
}

export function sumDefaultWaitTargetView(view: DefaultWaitTargetView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
