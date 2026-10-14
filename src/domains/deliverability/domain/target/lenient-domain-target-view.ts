import * as text from "../../../../kit/text.js";
import { LenientDomainTarget } from "./lenient-domain-target.js";

/** How screens and exports show a lenient domain target. */
export class LenientDomainTargetView {
  codeText: string;
  labelText: string;
  discountText: string;
  limit: string;
  currency: string;
  amount: string;
  pinned: string;
  name: string;
  source: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    discountText: string,
    limit: string,
    currency: string,
    amount: string,
    pinned: string,
    name: string,
    source: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.discountText = discountText;
    this.limit = limit;
    this.currency = currency;
    this.amount = amount;
    this.pinned = pinned;
    this.name = name;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toLenientDomainTargetView(item: LenientDomainTarget): LenientDomainTargetView {
  return new LenientDomainTargetView(
    item.code,
    item.label,
    item.discount.toFixed(2),
    String(item.limit),
    item.currency,
    item.amount.toFixed(2),
    `${item.pinned}`,
    text.truncate(item.name, 40),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientDomainTargetViews(items: LenientDomainTarget[]): LenientDomainTargetView[] {
  const views: LenientDomainTargetView[] = [];
  for (const item of items) {
    views.push(toLenientDomainTargetView(item));
  }
  return views;
}

export function sumLenientDomainTargetView(view: LenientDomainTargetView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedDiscount + parsedLimit + parsedAmount;
}
