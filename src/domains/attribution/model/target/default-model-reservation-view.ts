import * as text from "../../../../kit/text.js";
import { DefaultModelReservation } from "./default-model-reservation.js";

/** How screens and exports show a default model reservation. */
export class DefaultModelReservationView {
  codeText: string;
  titleText: string;
  externalRef: string;
  timezone: string;
  endsAtText: string;
  expiresAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    externalRef: string,
    timezone: string,
    endsAtText: string,
    expiresAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.externalRef = externalRef;
    this.timezone = timezone;
    this.endsAtText = endsAtText;
    this.expiresAtText = expiresAtText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultModelReservationView(item: DefaultModelReservation): DefaultModelReservationView {
  return new DefaultModelReservationView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 64),
    item.externalRef,
    text.truncate(item.timezone, 120),
    String(item.endsAt),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultModelReservationViews(items: DefaultModelReservation[]): DefaultModelReservationView[] {
  const views: DefaultModelReservationView[] = [];
  for (const item of items) {
    views.push(toDefaultModelReservationView(item));
  }
  return views;
}

export function sumDefaultModelReservationView(view: DefaultModelReservationView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedEndsAt + parsedExpiresAt;
}
