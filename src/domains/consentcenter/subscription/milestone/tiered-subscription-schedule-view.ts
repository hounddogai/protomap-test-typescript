import { TieredSubscriptionSchedule } from "./tiered-subscription-schedule.js";

/** How screens and exports show a tiered subscription schedule. */
export class TieredSubscriptionScheduleView {
  codeText: string;
  labelText: string;
  frequencyCap: string;
  timezone: string;
  discountText: string;
  margin: string;
  sendAt: string;
  openRateText: string;
  quantity: string;
  maximum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    frequencyCap: string,
    timezone: string,
    discountText: string,
    margin: string,
    sendAt: string,
    openRateText: string,
    quantity: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.frequencyCap = frequencyCap;
    this.timezone = timezone;
    this.discountText = discountText;
    this.margin = margin;
    this.sendAt = sendAt;
    this.openRateText = openRateText;
    this.quantity = quantity;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toTieredSubscriptionScheduleView(item: TieredSubscriptionSchedule): TieredSubscriptionScheduleView {
  return new TieredSubscriptionScheduleView(
    item.code,
    item.label,
    String(item.frequencyCap),
    item.timezone,
    item.discount.toFixed(2),
    item.margin.toFixed(2),
    String(item.sendAt),
    item.openRate.toFixed(2),
    String(item.quantity),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredSubscriptionScheduleViews(items: TieredSubscriptionSchedule[]): TieredSubscriptionScheduleView[] {
  const views: TieredSubscriptionScheduleView[] = [];
  for (const item of items) {
    views.push(toTieredSubscriptionScheduleView(item));
  }
  return views;
}

export function sumTieredSubscriptionScheduleView(view: TieredSubscriptionScheduleView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedFrequencyCap + parsedDiscount + parsedMargin;
}
