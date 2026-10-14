import * as text from "../../../../kit/text.js";
import { RegionalInsightGroup } from "./regional-insight-group.js";

/** How screens and exports show a regional insight group. */
export class RegionalInsightGroupView {
  code: string;
  label: string;
  discountText: string;
  maximum: string;
  durationMinutes: string;
  amount: string;
  phone: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    discountText: string,
    maximum: string,
    durationMinutes: string,
    amount: string,
    phone: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.discountText = discountText;
    this.maximum = maximum;
    this.durationMinutes = durationMinutes;
    this.amount = amount;
    this.phone = phone;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalInsightGroupView(item: RegionalInsightGroup): RegionalInsightGroupView {
  return new RegionalInsightGroupView(
    text.truncate(item.code, 64),
    item.label,
    item.discount.toFixed(2),
    item.maximum.toFixed(2),
    String(item.durationMinutes),
    item.amount.toFixed(2),
    item.phone,
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalInsightGroupViews(items: RegionalInsightGroup[]): RegionalInsightGroupView[] {
  const views: RegionalInsightGroupView[] = [];
  for (const item of items) {
    views.push(toRegionalInsightGroupView(item));
  }
  return views;
}

export function sumRegionalInsightGroupView(view: RegionalInsightGroupView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedDiscount + parsedMaximum + parsedDurationMinutes;
}
