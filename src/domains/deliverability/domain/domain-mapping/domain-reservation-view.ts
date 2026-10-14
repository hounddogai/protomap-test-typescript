import { DomainReservation } from "./domain-reservation.js";

/** How screens and exports show a domain reservation. */
export class DomainReservationView {
  code: string;
  nameText: string;
  budget: string;
  durationMinutesText: string;
  amountText: string;
  summaryText: string;
  currency: string;
  audienceIdText: string;
  priority: string;
  bidText: string;
  discountText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    budget: string,
    durationMinutesText: string,
    amountText: string,
    summaryText: string,
    currency: string,
    audienceIdText: string,
    priority: string,
    bidText: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.budget = budget;
    this.durationMinutesText = durationMinutesText;
    this.amountText = amountText;
    this.summaryText = summaryText;
    this.currency = currency;
    this.audienceIdText = audienceIdText;
    this.priority = priority;
    this.bidText = bidText;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toDomainReservationView(item: DomainReservation): DomainReservationView {
  return new DomainReservationView(
    item.code,
    item.name,
    item.budget.toFixed(2),
    String(item.durationMinutes),
    item.amount.toFixed(2),
    item.summary,
    item.currency,
    item.audienceId,
    String(item.priority),
    item.bid.toFixed(2),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainReservationViews(items: DomainReservation[]): DomainReservationView[] {
  const views: DomainReservationView[] = [];
  for (const item of items) {
    views.push(toDomainReservationView(item));
  }
  return views;
}

export function sumDomainReservationView(view: DomainReservationView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedBudget + parsedDurationMinutes + parsedAmount;
}
