import * as text from "../../../../kit/text.js";
import { PendingWarmupReservation } from "./pending-warmup-reservation.js";

/** How screens and exports show a pending warmup reservation. */
export class PendingWarmupReservationView {
  code: string;
  titleText: string;
  currency: string;
  country: string;
  limit: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    currency: string,
    country: string,
    limit: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.currency = currency;
    this.country = country;
    this.limit = limit;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toPendingWarmupReservationView(item: PendingWarmupReservation): PendingWarmupReservationView {
  return new PendingWarmupReservationView(
    text.truncate(item.code, 120),
    item.title,
    item.currency,
    item.country,
    String(item.limit),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingWarmupReservationViews(items: PendingWarmupReservation[]): PendingWarmupReservationView[] {
  const views: PendingWarmupReservationView[] = [];
  for (const item of items) {
    views.push(toPendingWarmupReservationView(item));
  }
  return views;
}

export function sumPendingWarmupReservationView(view: PendingWarmupReservationView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedLimit + parsedOpenRate;
}
