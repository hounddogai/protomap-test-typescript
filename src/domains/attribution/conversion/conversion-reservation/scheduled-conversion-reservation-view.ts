import * as text from "../../../../kit/text.js";
import { ScheduledConversionReservation } from "./scheduled-conversion-reservation.js";

/** How screens and exports show a scheduled conversion reservation. */
export class ScheduledConversionReservationView {
  codeText: string;
  label: string;
  contactEmail: string;
  capacity: string;
  audienceId: string;
  country: string;
  approved: string;
  minimum: string;
  budgetText: string;
  locale: string;
  variantText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    contactEmail: string,
    capacity: string,
    audienceId: string,
    country: string,
    approved: string,
    minimum: string,
    budgetText: string,
    locale: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.contactEmail = contactEmail;
    this.capacity = capacity;
    this.audienceId = audienceId;
    this.country = country;
    this.approved = approved;
    this.minimum = minimum;
    this.budgetText = budgetText;
    this.locale = locale;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledConversionReservationView(item: ScheduledConversionReservation): ScheduledConversionReservationView {
  return new ScheduledConversionReservationView(
    item.code,
    text.truncate(item.label, 64),
    item.contactEmail,
    String(item.capacity),
    item.audienceId,
    item.country,
    `${item.approved}`,
    item.minimum.toFixed(2),
    item.budget.toFixed(2),
    item.locale,
    text.truncate(item.variant, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledConversionReservationViews(items: ScheduledConversionReservation[]): ScheduledConversionReservationView[] {
  const views: ScheduledConversionReservationView[] = [];
  for (const item of items) {
    views.push(toScheduledConversionReservationView(item));
  }
  return views;
}

export function sumScheduledConversionReservationView(view: ScheduledConversionReservationView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedCapacity + parsedMinimum + parsedBudget;
}
