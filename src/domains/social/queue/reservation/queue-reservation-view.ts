import * as text from "../../../../kit/text.js";
import { QueueReservation } from "./queue-reservation.js";

/** How screens and exports show a queue reservation. */
export class QueueReservationView {
  code: string;
  label: string;
  locale: string;
  budgetText: string;
  currencyText: string;
  costText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    locale: string,
    budgetText: string,
    currencyText: string,
    costText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.budgetText = budgetText;
    this.currencyText = currencyText;
    this.costText = costText;
    this.statusLabel = statusLabel;
  }
}

export function toQueueReservationView(item: QueueReservation): QueueReservationView {
  return new QueueReservationView(
    item.code,
    item.label,
    item.locale,
    item.budget.toFixed(2),
    text.truncate(item.currency, 64),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueReservationViews(items: QueueReservation[]): QueueReservationView[] {
  const views: QueueReservationView[] = [];
  for (const item of items) {
    views.push(toQueueReservationView(item));
  }
  return views;
}

export function sumQueueReservationView(view: QueueReservationView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedBudget + parsedCost;
}
