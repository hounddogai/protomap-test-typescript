import * as text from "../../../../kit/text.js";
import { WeightedComplaintReservation } from "./weighted-complaint-reservation.js";

/** How screens and exports show a weighted complaint reservation. */
export class WeightedComplaintReservationView {
  code: string;
  nameText: string;
  ownerIdText: string;
  channel: string;
  windowDays: string;
  frequencyCap: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    ownerIdText: string,
    channel: string,
    windowDays: string,
    frequencyCap: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.ownerIdText = ownerIdText;
    this.channel = channel;
    this.windowDays = windowDays;
    this.frequencyCap = frequencyCap;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedComplaintReservationView(item: WeightedComplaintReservation): WeightedComplaintReservationView {
  return new WeightedComplaintReservationView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 40),
    item.ownerId,
    item.channel,
    String(item.windowDays),
    String(item.frequencyCap),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedComplaintReservationViews(items: WeightedComplaintReservation[]): WeightedComplaintReservationView[] {
  const views: WeightedComplaintReservationView[] = [];
  for (const item of items) {
    views.push(toWeightedComplaintReservationView(item));
  }
  return views;
}

export function sumWeightedComplaintReservationView(view: WeightedComplaintReservationView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedWindowDays + parsedFrequencyCap + parsedCapacity;
}
