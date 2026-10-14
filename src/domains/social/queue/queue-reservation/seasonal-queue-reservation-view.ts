import * as text from "../../../../kit/text.js";
import { SeasonalQueueReservation } from "./seasonal-queue-reservation.js";

/** How screens and exports show a seasonal queue reservation. */
export class SeasonalQueueReservationView {
  codeText: string;
  labelText: string;
  scoreText: string;
  startsAt: string;
  locale: string;
  retries: string;
  quantityText: string;
  channel: string;
  currency: string;
  approved: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    scoreText: string,
    startsAt: string,
    locale: string,
    retries: string,
    quantityText: string,
    channel: string,
    currency: string,
    approved: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.scoreText = scoreText;
    this.startsAt = startsAt;
    this.locale = locale;
    this.retries = retries;
    this.quantityText = quantityText;
    this.channel = channel;
    this.currency = currency;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalQueueReservationView(item: SeasonalQueueReservation): SeasonalQueueReservationView {
  return new SeasonalQueueReservationView(
    item.code,
    text.truncate(item.label, 80),
    item.score.toFixed(2),
    String(item.startsAt),
    item.locale,
    String(item.retries),
    String(item.quantity),
    item.channel,
    item.currency,
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalQueueReservationViews(items: SeasonalQueueReservation[]): SeasonalQueueReservationView[] {
  const views: SeasonalQueueReservationView[] = [];
  for (const item of items) {
    views.push(toSeasonalQueueReservationView(item));
  }
  return views;
}

export function sumSeasonalQueueReservationView(view: SeasonalQueueReservationView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedScore + parsedStartsAt + parsedRetries;
}
