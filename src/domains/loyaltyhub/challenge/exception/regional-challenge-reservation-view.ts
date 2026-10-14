import * as text from "../../../../kit/text.js";
import { RegionalChallengeReservation } from "./regional-challenge-reservation.js";

/** How screens and exports show a regional challenge reservation. */
export class RegionalChallengeReservationView {
  code: string;
  titleText: string;
  threshold: string;
  windowDays: string;
  retries: string;
  startsAt: string;
  revisionText: string;
  summary: string;
  quantity: string;
  ratioText: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    threshold: string,
    windowDays: string,
    retries: string,
    startsAt: string,
    revisionText: string,
    summary: string,
    quantity: string,
    ratioText: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.threshold = threshold;
    this.windowDays = windowDays;
    this.retries = retries;
    this.startsAt = startsAt;
    this.revisionText = revisionText;
    this.summary = summary;
    this.quantity = quantity;
    this.ratioText = ratioText;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalChallengeReservationView(item: RegionalChallengeReservation): RegionalChallengeReservationView {
  return new RegionalChallengeReservationView(
    text.truncate(item.code, 64),
    item.title,
    item.threshold.toFixed(2),
    String(item.windowDays),
    String(item.retries),
    String(item.startsAt),
    String(item.revision),
    item.summary,
    String(item.quantity),
    item.ratio.toFixed(2),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalChallengeReservationViews(items: RegionalChallengeReservation[]): RegionalChallengeReservationView[] {
  const views: RegionalChallengeReservationView[] = [];
  for (const item of items) {
    views.push(toRegionalChallengeReservationView(item));
  }
  return views;
}

export function sumRegionalChallengeReservationView(view: RegionalChallengeReservationView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedThreshold + parsedWindowDays + parsedRetries;
}
