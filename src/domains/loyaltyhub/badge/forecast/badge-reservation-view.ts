import * as text from "../../../../kit/text.js";
import { BadgeReservation } from "./badge-reservation.js";

/** How screens and exports show a badge reservation. */
export class BadgeReservationView {
  code: string;
  label: string;
  summaryText: string;
  floorValue: string;
  conversionRateText: string;
  marginText: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    summaryText: string,
    floorValue: string,
    conversionRateText: string,
    marginText: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.summaryText = summaryText;
    this.floorValue = floorValue;
    this.conversionRateText = conversionRateText;
    this.marginText = marginText;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeReservationView(item: BadgeReservation): BadgeReservationView {
  return new BadgeReservationView(
    item.code,
    item.label,
    text.truncate(item.summary, 80),
    item.floorValue.toFixed(2),
    item.conversionRate.toFixed(2),
    item.margin.toFixed(2),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeReservationViews(items: BadgeReservation[]): BadgeReservationView[] {
  const views: BadgeReservationView[] = [];
  for (const item of items) {
    views.push(toBadgeReservationView(item));
  }
  return views;
}

export function sumBadgeReservationView(view: BadgeReservationView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedFloorValue + parsedConversionRate + parsedMargin;
}
