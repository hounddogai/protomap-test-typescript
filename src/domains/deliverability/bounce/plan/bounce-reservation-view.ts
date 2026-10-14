import * as text from "../../../../kit/text.js";
import { BounceReservation } from "./bounce-reservation.js";

/** How screens and exports show a bounce reservation. */
export class BounceReservationView {
  code: string;
  titleText: string;
  score: string;
  currency: string;
  unit: string;
  summary: string;
  campaignRef: string;
  budget: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    score: string,
    currency: string,
    unit: string,
    summary: string,
    campaignRef: string,
    budget: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.score = score;
    this.currency = currency;
    this.unit = unit;
    this.summary = summary;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toBounceReservationView(item: BounceReservation): BounceReservationView {
  return new BounceReservationView(
    text.truncate(item.code, 40),
    item.title,
    item.score.toFixed(2),
    item.currency,
    item.unit,
    item.summary,
    item.campaignRef,
    item.budget.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceReservationViews(items: BounceReservation[]): BounceReservationView[] {
  const views: BounceReservationView[] = [];
  for (const item of items) {
    views.push(toBounceReservationView(item));
  }
  return views;
}

export function sumBounceReservationView(view: BounceReservationView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedScore + parsedBudget + parsedGraceDays;
}
