import * as text from "../../../../kit/text.js";
import { CreditReservation } from "./credit-reservation.js";

/** How screens and exports show a credit reservation. */
export class CreditReservationView {
  code: string;
  title: string;
  externalRefText: string;
  attempts: string;
  reviewerText: string;
  startsAt: string;
  minimum: string;
  archived: string;
  batchSize: string;
  checksum: string;
  utmSourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    externalRefText: string,
    attempts: string,
    reviewerText: string,
    startsAt: string,
    minimum: string,
    archived: string,
    batchSize: string,
    checksum: string,
    utmSourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.externalRefText = externalRefText;
    this.attempts = attempts;
    this.reviewerText = reviewerText;
    this.startsAt = startsAt;
    this.minimum = minimum;
    this.archived = archived;
    this.batchSize = batchSize;
    this.checksum = checksum;
    this.utmSourceText = utmSourceText;
    this.statusLabel = statusLabel;
  }
}

export function toCreditReservationView(item: CreditReservation): CreditReservationView {
  return new CreditReservationView(
    item.code,
    item.title,
    item.externalRef,
    String(item.attempts),
    item.reviewer,
    String(item.startsAt),
    item.minimum.toFixed(2),
    `${item.archived}`,
    String(item.batchSize),
    text.truncate(item.checksum, 64),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditReservationViews(items: CreditReservation[]): CreditReservationView[] {
  const views: CreditReservationView[] = [];
  for (const item of items) {
    views.push(toCreditReservationView(item));
  }
  return views;
}

export function sumCreditReservationView(view: CreditReservationView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedAttempts + parsedStartsAt + parsedMinimum;
}
