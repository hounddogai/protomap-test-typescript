import { ScheduledLevelReservation } from "./scheduled-level-reservation.js";

/** How screens and exports show a scheduled level reservation. */
export class ScheduledLevelReservationView {
  code: string;
  name: string;
  segment: string;
  source: string;
  archived: string;
  discount: string;
  currency: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    segment: string,
    source: string,
    archived: string,
    discount: string,
    currency: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.source = source;
    this.archived = archived;
    this.discount = discount;
    this.currency = currency;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledLevelReservationView(item: ScheduledLevelReservation): ScheduledLevelReservationView {
  return new ScheduledLevelReservationView(
    item.code,
    item.name,
    item.segment,
    item.source,
    `${item.archived}`,
    item.discount.toFixed(2),
    item.currency,
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledLevelReservationViews(items: ScheduledLevelReservation[]): ScheduledLevelReservationView[] {
  const views: ScheduledLevelReservationView[] = [];
  for (const item of items) {
    views.push(toScheduledLevelReservationView(item));
  }
  return views;
}

export function sumScheduledLevelReservationView(view: ScheduledLevelReservationView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedDiscount + parsedWindowDays;
}
