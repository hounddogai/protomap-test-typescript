import { RegionalBadgeReservation } from "./regional-badge-reservation.js";

/** How screens and exports show a regional badge reservation. */
export class RegionalBadgeReservationView {
  code: string;
  title: string;
  bid: string;
  region: string;
  durationMinutes: string;
  attempts: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    bid: string,
    region: string,
    durationMinutes: string,
    attempts: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.region = region;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalBadgeReservationView(item: RegionalBadgeReservation): RegionalBadgeReservationView {
  return new RegionalBadgeReservationView(
    item.code,
    item.title,
    item.bid.toFixed(2),
    item.region,
    String(item.durationMinutes),
    String(item.attempts),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalBadgeReservationViews(items: RegionalBadgeReservation[]): RegionalBadgeReservationView[] {
  const views: RegionalBadgeReservationView[] = [];
  for (const item of items) {
    views.push(toRegionalBadgeReservationView(item));
  }
  return views;
}

export function sumRegionalBadgeReservationView(view: RegionalBadgeReservationView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedBid + parsedDurationMinutes + parsedAttempts;
}
