import * as text from "../../../../kit/text.js";
import { EnrollmentReservation } from "./enrollment-reservation.js";

/** How screens and exports show a enrollment reservation. */
export class EnrollmentReservationView {
  code: string;
  titleText: string;
  threshold: string;
  currency: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    threshold: string,
    currency: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.threshold = threshold;
    this.currency = currency;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentReservationView(item: EnrollmentReservation): EnrollmentReservationView {
  return new EnrollmentReservationView(
    text.truncate(item.code, 120),
    item.title,
    item.threshold.toFixed(2),
    item.currency,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentReservationViews(items: EnrollmentReservation[]): EnrollmentReservationView[] {
  const views: EnrollmentReservationView[] = [];
  for (const item of items) {
    views.push(toEnrollmentReservationView(item));
  }
  return views;
}

export function sumEnrollmentReservationView(view: EnrollmentReservationView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedThreshold + parsedBudget;
}
