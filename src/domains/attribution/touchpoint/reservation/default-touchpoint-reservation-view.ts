import * as text from "../../../../kit/text.js";
import { DefaultTouchpointReservation } from "./default-touchpoint-reservation.js";

/** How screens and exports show a default touchpoint reservation. */
export class DefaultTouchpointReservationView {
  codeText: string;
  label: string;
  clicks: string;
  cohort: string;
  startsAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    clicks: string,
    cohort: string,
    startsAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.clicks = clicks;
    this.cohort = cohort;
    this.startsAtText = startsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultTouchpointReservationView(item: DefaultTouchpointReservation): DefaultTouchpointReservationView {
  return new DefaultTouchpointReservationView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 40),
    String(item.clicks),
    text.truncate(item.cohort, 64),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultTouchpointReservationViews(items: DefaultTouchpointReservation[]): DefaultTouchpointReservationView[] {
  const views: DefaultTouchpointReservationView[] = [];
  for (const item of items) {
    views.push(toDefaultTouchpointReservationView(item));
  }
  return views;
}

export function sumDefaultTouchpointReservationView(view: DefaultTouchpointReservationView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedClicks + parsedStartsAt;
}
