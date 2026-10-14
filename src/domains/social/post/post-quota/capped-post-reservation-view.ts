import * as text from "../../../../kit/text.js";
import { CappedPostReservation } from "./capped-post-reservation.js";

/** How screens and exports show a capped post reservation. */
export class CappedPostReservationView {
  code: string;
  label: string;
  capacity: string;
  unitText: string;
  windowDays: string;
  createdAt: string;
  country: string;
  impressions: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    capacity: string,
    unitText: string,
    windowDays: string,
    createdAt: string,
    country: string,
    impressions: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.unitText = unitText;
    this.windowDays = windowDays;
    this.createdAt = createdAt;
    this.country = country;
    this.impressions = impressions;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toCappedPostReservationView(item: CappedPostReservation): CappedPostReservationView {
  return new CappedPostReservationView(
    item.code,
    text.truncate(item.label, 120),
    String(item.capacity),
    text.truncate(item.unit, 40),
    String(item.windowDays),
    String(item.createdAt),
    item.country,
    String(item.impressions),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedPostReservationViews(items: CappedPostReservation[]): CappedPostReservationView[] {
  const views: CappedPostReservationView[] = [];
  for (const item of items) {
    views.push(toCappedPostReservationView(item));
  }
  return views;
}

export function sumCappedPostReservationView(view: CappedPostReservationView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedCapacity + parsedWindowDays + parsedCreatedAt;
}
