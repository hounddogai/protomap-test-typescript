import { PacingSchedule } from "./pacing-schedule.js";

/** How screens and exports show a pacing schedule. */
export class PacingScheduleView {
  code: string;
  label: string;
  quantityText: string;
  startsAt: string;
  clicks: string;
  minimum: string;
  timezone: string;
  country: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    quantityText: string,
    startsAt: string,
    clicks: string,
    minimum: string,
    timezone: string,
    country: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.quantityText = quantityText;
    this.startsAt = startsAt;
    this.clicks = clicks;
    this.minimum = minimum;
    this.timezone = timezone;
    this.country = country;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toPacingScheduleView(item: PacingSchedule): PacingScheduleView {
  return new PacingScheduleView(
    item.code,
    item.label,
    String(item.quantity),
    String(item.startsAt),
    String(item.clicks),
    item.minimum.toFixed(2),
    item.timezone,
    item.country,
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingScheduleViews(items: PacingSchedule[]): PacingScheduleView[] {
  const views: PacingScheduleView[] = [];
  for (const item of items) {
    views.push(toPacingScheduleView(item));
  }
  return views;
}

export function sumPacingScheduleView(view: PacingScheduleView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedQuantity + parsedStartsAt + parsedClicks;
}
