import * as text from "../../../../kit/text.js";
import { DefaultSubscriptionCycle } from "./default-subscription-cycle.js";

/** How screens and exports show a default subscription cycle. */
export class DefaultSubscriptionCycleView {
  code: string;
  labelText: string;
  locale: string;
  externalRefText: string;
  capacityText: string;
  variant: string;
  rate: string;
  windowDaysText: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    locale: string,
    externalRefText: string,
    capacityText: string,
    variant: string,
    rate: string,
    windowDaysText: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.locale = locale;
    this.externalRefText = externalRefText;
    this.capacityText = capacityText;
    this.variant = variant;
    this.rate = rate;
    this.windowDaysText = windowDaysText;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultSubscriptionCycleView(item: DefaultSubscriptionCycle): DefaultSubscriptionCycleView {
  return new DefaultSubscriptionCycleView(
    item.code,
    item.label,
    item.locale,
    text.truncate(item.externalRef, 40),
    String(item.capacity),
    text.truncate(item.variant, 40),
    item.rate.toFixed(2),
    String(item.windowDays),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultSubscriptionCycleViews(items: DefaultSubscriptionCycle[]): DefaultSubscriptionCycleView[] {
  const views: DefaultSubscriptionCycleView[] = [];
  for (const item of items) {
    views.push(toDefaultSubscriptionCycleView(item));
  }
  return views;
}

export function sumDefaultSubscriptionCycleView(view: DefaultSubscriptionCycleView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedCapacity + parsedRate + parsedWindowDays;
}
