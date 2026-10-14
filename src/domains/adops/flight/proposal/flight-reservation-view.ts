import * as text from "../../../../kit/text.js";
import { FlightReservation } from "./flight-reservation.js";

/** How screens and exports show a flight reservation. */
export class FlightReservationView {
  code: string;
  label: string;
  nameText: string;
  openRateText: string;
  maximum: string;
  region: string;
  createdAtText: string;
  ownerId: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    nameText: string,
    openRateText: string,
    maximum: string,
    region: string,
    createdAtText: string,
    ownerId: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.nameText = nameText;
    this.openRateText = openRateText;
    this.maximum = maximum;
    this.region = region;
    this.createdAtText = createdAtText;
    this.ownerId = ownerId;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toFlightReservationView(item: FlightReservation): FlightReservationView {
  return new FlightReservationView(
    text.truncate(item.code, 64),
    item.label,
    item.name,
    item.openRate.toFixed(2),
    item.maximum.toFixed(2),
    item.region,
    String(item.createdAt),
    item.ownerId,
    text.truncate(item.channel, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightReservationViews(items: FlightReservation[]): FlightReservationView[] {
  const views: FlightReservationView[] = [];
  for (const item of items) {
    views.push(toFlightReservationView(item));
  }
  return views;
}

export function sumFlightReservationView(view: FlightReservationView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedOpenRate + parsedMaximum + parsedCreatedAt;
}
