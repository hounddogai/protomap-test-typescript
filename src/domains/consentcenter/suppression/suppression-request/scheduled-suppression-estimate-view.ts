import * as text from "../../../../kit/text.js";
import { ScheduledSuppressionEstimate } from "./scheduled-suppression-estimate.js";

/** How screens and exports show a scheduled suppression estimate. */
export class ScheduledSuppressionEstimateView {
  code: string;
  name: string;
  pinned: string;
  ceiling: string;
  channel: string;
  quantity: string;
  externalRefText: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    pinned: string,
    ceiling: string,
    channel: string,
    quantity: string,
    externalRefText: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.ceiling = ceiling;
    this.channel = channel;
    this.quantity = quantity;
    this.externalRefText = externalRefText;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledSuppressionEstimateView(item: ScheduledSuppressionEstimate): ScheduledSuppressionEstimateView {
  return new ScheduledSuppressionEstimateView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 80),
    `${item.pinned}`,
    item.ceiling.toFixed(2),
    text.truncate(item.channel, 64),
    String(item.quantity),
    item.externalRef,
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledSuppressionEstimateViews(items: ScheduledSuppressionEstimate[]): ScheduledSuppressionEstimateView[] {
  const views: ScheduledSuppressionEstimateView[] = [];
  for (const item of items) {
    views.push(toScheduledSuppressionEstimateView(item));
  }
  return views;
}

export function sumScheduledSuppressionEstimateView(view: ScheduledSuppressionEstimateView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedCeiling + parsedQuantity;
}
