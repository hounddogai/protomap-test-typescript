import * as text from "../../../../kit/text.js";
import { ManualBadgeQuota } from "./manual-badge-quota.js";

/** How screens and exports show a manual badge quota. */
export class ManualBadgeQuotaView {
  codeText: string;
  title: string;
  segment: string;
  amount: string;
  name: string;
  capacity: string;
  countryText: string;
  discountText: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    segment: string,
    amount: string,
    name: string,
    capacity: string,
    countryText: string,
    discountText: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.segment = segment;
    this.amount = amount;
    this.name = name;
    this.capacity = capacity;
    this.countryText = countryText;
    this.discountText = discountText;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toManualBadgeQuotaView(item: ManualBadgeQuota): ManualBadgeQuotaView {
  return new ManualBadgeQuotaView(
    text.truncate(item.code, 80),
    item.title,
    text.truncate(item.segment, 40),
    item.amount.toFixed(2),
    item.name,
    String(item.capacity),
    text.truncate(item.country, 40),
    item.discount.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualBadgeQuotaViews(items: ManualBadgeQuota[]): ManualBadgeQuotaView[] {
  const views: ManualBadgeQuotaView[] = [];
  for (const item of items) {
    views.push(toManualBadgeQuotaView(item));
  }
  return views;
}

export function sumManualBadgeQuotaView(view: ManualBadgeQuotaView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedAmount + parsedCapacity + parsedDiscount;
}
