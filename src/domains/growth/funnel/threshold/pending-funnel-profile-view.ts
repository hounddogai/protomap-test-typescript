import * as text from "../../../../kit/text.js";
import { PendingFunnelProfile } from "./pending-funnel-profile.js";

/** How screens and exports show a pending funnel profile. */
export class PendingFunnelProfileView {
  code: string;
  labelText: string;
  categoryText: string;
  currency: string;
  discount: string;
  priorityText: string;
  durationMinutes: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    categoryText: string,
    currency: string,
    discount: string,
    priorityText: string,
    durationMinutes: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.categoryText = categoryText;
    this.currency = currency;
    this.discount = discount;
    this.priorityText = priorityText;
    this.durationMinutes = durationMinutes;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toPendingFunnelProfileView(item: PendingFunnelProfile): PendingFunnelProfileView {
  return new PendingFunnelProfileView(
    text.truncate(item.code, 40),
    item.label,
    text.truncate(item.category, 120),
    item.currency,
    item.discount.toFixed(2),
    String(item.priority),
    String(item.durationMinutes),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingFunnelProfileViews(items: PendingFunnelProfile[]): PendingFunnelProfileView[] {
  const views: PendingFunnelProfileView[] = [];
  for (const item of items) {
    views.push(toPendingFunnelProfileView(item));
  }
  return views;
}

export function sumPendingFunnelProfileView(view: PendingFunnelProfileView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedDiscount + parsedPriority + parsedDurationMinutes;
}
