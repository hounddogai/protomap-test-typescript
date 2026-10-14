import * as text from "../../../../kit/text.js";
import { BranchManifest } from "./branch-manifest.js";

/** How screens and exports show a branch manifest. */
export class BranchManifestView {
  code: string;
  label: string;
  locale: string;
  amount: string;
  discount: string;
  category: string;
  timezoneText: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    locale: string,
    amount: string,
    discount: string,
    category: string,
    timezoneText: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.amount = amount;
    this.discount = discount;
    this.category = category;
    this.timezoneText = timezoneText;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toBranchManifestView(item: BranchManifest): BranchManifestView {
  return new BranchManifestView(
    item.code,
    item.label,
    text.truncate(item.locale, 40),
    item.amount.toFixed(2),
    item.discount.toFixed(2),
    item.category,
    text.truncate(item.timezone, 40),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchManifestViews(items: BranchManifest[]): BranchManifestView[] {
  const views: BranchManifestView[] = [];
  for (const item of items) {
    views.push(toBranchManifestView(item));
  }
  return views;
}

export function sumBranchManifestView(view: BranchManifestView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedAmount + parsedDiscount;
}
