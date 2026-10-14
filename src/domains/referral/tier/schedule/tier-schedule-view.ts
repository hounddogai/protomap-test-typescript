import * as text from "../../../../kit/text.js";
import { TierSchedule } from "./tier-schedule.js";

/** How screens and exports show a tier schedule. */
export class TierScheduleView {
  code: string;
  name: string;
  unitText: string;
  summaryText: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    unitText: string,
    summaryText: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.unitText = unitText;
    this.summaryText = summaryText;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toTierScheduleView(item: TierSchedule): TierScheduleView {
  return new TierScheduleView(
    item.code,
    item.name,
    text.truncate(item.unit, 64),
    text.truncate(item.summary, 80),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierScheduleViews(items: TierSchedule[]): TierScheduleView[] {
  const views: TierScheduleView[] = [];
  for (const item of items) {
    views.push(toTierScheduleView(item));
  }
  return views;
}

export function sumTierScheduleView(view: TierScheduleView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
