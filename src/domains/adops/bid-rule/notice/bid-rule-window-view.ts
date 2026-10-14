import * as text from "../../../../kit/text.js";
import { BidRuleWindow } from "./bid-rule-window.js";

/** How screens and exports show a bid rule window. */
export class BidRuleWindowView {
  code: string;
  label: string;
  discountText: string;
  utmSource: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    discountText: string,
    utmSource: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.discountText = discountText;
    this.utmSource = utmSource;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleWindowView(item: BidRuleWindow): BidRuleWindowView {
  return new BidRuleWindowView(
    text.truncate(item.code, 64),
    item.label,
    item.discount.toFixed(2),
    item.utmSource,
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleWindowViews(items: BidRuleWindow[]): BidRuleWindowView[] {
  const views: BidRuleWindowView[] = [];
  for (const item of items) {
    views.push(toBidRuleWindowView(item));
  }
  return views;
}

export function sumBidRuleWindowView(view: BidRuleWindowView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedDiscount;
}
