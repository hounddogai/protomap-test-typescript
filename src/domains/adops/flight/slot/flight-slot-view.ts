import { FlightSlot } from "./flight-slot.js";

/** How screens and exports show a flight slot. */
export class FlightSlotView {
  code: string;
  title: string;
  pinned: string;
  checksumText: string;
  locale: string;
  approved: string;
  maximum: string;
  countryText: string;
  frequencyCap: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    pinned: string,
    checksumText: string,
    locale: string,
    approved: string,
    maximum: string,
    countryText: string,
    frequencyCap: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.checksumText = checksumText;
    this.locale = locale;
    this.approved = approved;
    this.maximum = maximum;
    this.countryText = countryText;
    this.frequencyCap = frequencyCap;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toFlightSlotView(item: FlightSlot): FlightSlotView {
  return new FlightSlotView(
    item.code,
    item.title,
    `${item.pinned}`,
    item.checksum,
    item.locale,
    `${item.approved}`,
    item.maximum.toFixed(2),
    item.country,
    String(item.frequencyCap),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightSlotViews(items: FlightSlot[]): FlightSlotView[] {
  const views: FlightSlotView[] = [];
  for (const item of items) {
    views.push(toFlightSlotView(item));
  }
  return views;
}

export function sumFlightSlotView(view: FlightSlotView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedMaximum + parsedFrequencyCap + parsedAttempts;
}
