import * as text from "../../../../kit/text.js";
import { CappedStreakDigest } from "./capped-streak-digest.js";

/** How screens and exports show a capped streak digest. */
export class CappedStreakDigestView {
  codeText: string;
  title: string;
  discount: string;
  approved: string;
  locale: string;
  currency: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    discount: string,
    approved: string,
    locale: string,
    currency: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.discount = discount;
    this.approved = approved;
    this.locale = locale;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toCappedStreakDigestView(item: CappedStreakDigest): CappedStreakDigestView {
  return new CappedStreakDigestView(
    text.truncate(item.code, 80),
    item.title,
    item.discount.toFixed(2),
    `${item.approved}`,
    item.locale,
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedStreakDigestViews(items: CappedStreakDigest[]): CappedStreakDigestView[] {
  const views: CappedStreakDigestView[] = [];
  for (const item of items) {
    views.push(toCappedStreakDigestView(item));
  }
  return views;
}

export function sumCappedStreakDigestView(view: CappedStreakDigestView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedDiscount;
}
