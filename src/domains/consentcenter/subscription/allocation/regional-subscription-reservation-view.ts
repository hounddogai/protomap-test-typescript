import * as text from "../../../../kit/text.js";
import { RegionalSubscriptionReservation } from "./regional-subscription-reservation.js";

/** How screens and exports show a regional subscription reservation. */
export class RegionalSubscriptionReservationView {
  codeText: string;
  title: string;
  sequence: string;
  openRate: string;
  bid: string;
  threshold: string;
  summaryText: string;
  budget: string;
  amountText: string;
  createdAt: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    sequence: string,
    openRate: string,
    bid: string,
    threshold: string,
    summaryText: string,
    budget: string,
    amountText: string,
    createdAt: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.sequence = sequence;
    this.openRate = openRate;
    this.bid = bid;
    this.threshold = threshold;
    this.summaryText = summaryText;
    this.budget = budget;
    this.amountText = amountText;
    this.createdAt = createdAt;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalSubscriptionReservationView(item: RegionalSubscriptionReservation): RegionalSubscriptionReservationView {
  return new RegionalSubscriptionReservationView(
    text.truncate(item.code, 40),
    item.title,
    String(item.sequence),
    item.openRate.toFixed(2),
    item.bid.toFixed(2),
    item.threshold.toFixed(2),
    item.summary,
    item.budget.toFixed(2),
    item.amount.toFixed(2),
    String(item.createdAt),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalSubscriptionReservationViews(items: RegionalSubscriptionReservation[]): RegionalSubscriptionReservationView[] {
  const views: RegionalSubscriptionReservationView[] = [];
  for (const item of items) {
    views.push(toRegionalSubscriptionReservationView(item));
  }
  return views;
}

export function sumRegionalSubscriptionReservationView(view: RegionalSubscriptionReservationView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedSequence + parsedOpenRate + parsedBid;
}
