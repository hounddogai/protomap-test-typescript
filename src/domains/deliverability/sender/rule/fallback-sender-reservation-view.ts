import * as text from "../../../../kit/text.js";
import { FallbackSenderReservation } from "./fallback-sender-reservation.js";

/** How screens and exports show a fallback sender reservation. */
export class FallbackSenderReservationView {
  code: string;
  title: string;
  channel: string;
  currency: string;
  locale: string;
  createdAtText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    channel: string,
    currency: string,
    locale: string,
    createdAtText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.currency = currency;
    this.locale = locale;
    this.createdAtText = createdAtText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackSenderReservationView(item: FallbackSenderReservation): FallbackSenderReservationView {
  return new FallbackSenderReservationView(
    item.code,
    text.truncate(item.title, 40),
    item.channel,
    item.currency,
    item.locale,
    String(item.createdAt),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackSenderReservationViews(items: FallbackSenderReservation[]): FallbackSenderReservationView[] {
  const views: FallbackSenderReservationView[] = [];
  for (const item of items) {
    views.push(toFallbackSenderReservationView(item));
  }
  return views;
}

export function sumFallbackSenderReservationView(view: FallbackSenderReservationView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedCreatedAt + parsedBudget;
}
