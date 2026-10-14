import * as text from "../../../../kit/text.js";
import { FraudCheckReservation } from "./fraud-check-reservation.js";

/** How screens and exports show a fraud check reservation. */
export class FraudCheckReservationView {
  code: string;
  title: string;
  countryText: string;
  discountText: string;
  durationMinutesText: string;
  impressionsText: string;
  notes: string;
  revision: string;
  sequence: string;
  amount: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    countryText: string,
    discountText: string,
    durationMinutesText: string,
    impressionsText: string,
    notes: string,
    revision: string,
    sequence: string,
    amount: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.countryText = countryText;
    this.discountText = discountText;
    this.durationMinutesText = durationMinutesText;
    this.impressionsText = impressionsText;
    this.notes = notes;
    this.revision = revision;
    this.sequence = sequence;
    this.amount = amount;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckReservationView(item: FraudCheckReservation): FraudCheckReservationView {
  return new FraudCheckReservationView(
    item.code,
    text.truncate(item.title, 80),
    item.country,
    item.discount.toFixed(2),
    String(item.durationMinutes),
    String(item.impressions),
    text.truncate(item.notes, 120),
    String(item.revision),
    String(item.sequence),
    item.amount.toFixed(2),
    text.truncate(item.summary, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckReservationViews(items: FraudCheckReservation[]): FraudCheckReservationView[] {
  const views: FraudCheckReservationView[] = [];
  for (const item of items) {
    views.push(toFraudCheckReservationView(item));
  }
  return views;
}

export function sumFraudCheckReservationView(view: FraudCheckReservationView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedDiscount + parsedDurationMinutes + parsedImpressions;
}
