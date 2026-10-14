import { PaywallReservation } from "./paywall-reservation.js";

/** How screens and exports show a paywall reservation. */
export class PaywallReservationView {
  codeText: string;
  name: string;
  title: string;
  frequencyCap: string;
  discountText: string;
  budgetText: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    title: string,
    frequencyCap: string,
    discountText: string,
    budgetText: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.discountText = discountText;
    this.budgetText = budgetText;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallReservationView(item: PaywallReservation): PaywallReservationView {
  return new PaywallReservationView(
    item.code,
    item.name,
    item.title,
    String(item.frequencyCap),
    item.discount.toFixed(2),
    item.budget.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallReservationViews(items: PaywallReservation[]): PaywallReservationView[] {
  const views: PaywallReservationView[] = [];
  for (const item of items) {
    views.push(toPaywallReservationView(item));
  }
  return views;
}

export function sumPaywallReservationView(view: PaywallReservationView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedFrequencyCap + parsedDiscount + parsedBudget;
}
