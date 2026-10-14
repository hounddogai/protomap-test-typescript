import * as text from "../../../../kit/text.js";
import { ManualPlacementSlot } from "./manual-placement-slot.js";

/** How screens and exports show a manual placement slot. */
export class ManualPlacementSlotView {
  code: string;
  nameText: string;
  startsAt: string;
  openRateText: string;
  timezone: string;
  locale: string;
  maximum: string;
  quantity: string;
  budget: string;
  source: string;
  clicksText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    startsAt: string,
    openRateText: string,
    timezone: string,
    locale: string,
    maximum: string,
    quantity: string,
    budget: string,
    source: string,
    clicksText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.startsAt = startsAt;
    this.openRateText = openRateText;
    this.timezone = timezone;
    this.locale = locale;
    this.maximum = maximum;
    this.quantity = quantity;
    this.budget = budget;
    this.source = source;
    this.clicksText = clicksText;
    this.statusLabel = statusLabel;
  }
}

export function toManualPlacementSlotView(item: ManualPlacementSlot): ManualPlacementSlotView {
  return new ManualPlacementSlotView(
    item.code,
    item.name,
    String(item.startsAt),
    item.openRate.toFixed(2),
    text.truncate(item.timezone, 120),
    item.locale,
    item.maximum.toFixed(2),
    String(item.quantity),
    item.budget.toFixed(2),
    text.truncate(item.source, 120),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPlacementSlotViews(items: ManualPlacementSlot[]): ManualPlacementSlotView[] {
  const views: ManualPlacementSlotView[] = [];
  for (const item of items) {
    views.push(toManualPlacementSlotView(item));
  }
  return views;
}

export function sumManualPlacementSlotView(view: ManualPlacementSlotView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedStartsAt + parsedOpenRate + parsedMaximum;
}
