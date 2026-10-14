import { DefaultComplaintReservation } from "./default-complaint-reservation.js";

/** How screens and exports show a default complaint reservation. */
export class DefaultComplaintReservationView {
  code: string;
  title: string;
  revision: string;
  budget: string;
  openRateText: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    revision: string,
    budget: string,
    openRateText: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.budget = budget;
    this.openRateText = openRateText;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultComplaintReservationView(item: DefaultComplaintReservation): DefaultComplaintReservationView {
  return new DefaultComplaintReservationView(
    item.code,
    item.title,
    String(item.revision),
    item.budget.toFixed(2),
    item.openRate.toFixed(2),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultComplaintReservationViews(items: DefaultComplaintReservation[]): DefaultComplaintReservationView[] {
  const views: DefaultComplaintReservationView[] = [];
  for (const item of items) {
    views.push(toDefaultComplaintReservationView(item));
  }
  return views;
}

export function sumDefaultComplaintReservationView(view: DefaultComplaintReservationView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedRevision + parsedBudget + parsedOpenRate;
}
