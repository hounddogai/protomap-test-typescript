import * as text from "../../../../kit/text.js";
import { ConversionReservation } from "./conversion-reservation.js";

/** How screens and exports show a conversion reservation. */
export class ConversionReservationView {
  codeText: string;
  nameText: string;
  segment: string;
  endsAtText: string;
  visible: string;
  clicks: string;
  journeyId: string;
  timezone: string;
  label: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    segment: string,
    endsAtText: string,
    visible: string,
    clicks: string,
    journeyId: string,
    timezone: string,
    label: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.segment = segment;
    this.endsAtText = endsAtText;
    this.visible = visible;
    this.clicks = clicks;
    this.journeyId = journeyId;
    this.timezone = timezone;
    this.label = label;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toConversionReservationView(item: ConversionReservation): ConversionReservationView {
  return new ConversionReservationView(
    item.code,
    text.truncate(item.name, 120),
    item.segment,
    String(item.endsAt),
    `${item.visible}`,
    String(item.clicks),
    text.truncate(item.journeyId, 80),
    text.truncate(item.timezone, 40),
    item.label,
    text.truncate(item.contactEmail, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionReservationViews(items: ConversionReservation[]): ConversionReservationView[] {
  const views: ConversionReservationView[] = [];
  for (const item of items) {
    views.push(toConversionReservationView(item));
  }
  return views;
}

export function sumConversionReservationView(view: ConversionReservationView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedEndsAt + parsedClicks;
}
