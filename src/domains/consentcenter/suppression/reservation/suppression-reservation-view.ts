import * as text from "../../../../kit/text.js";
import { SuppressionReservation } from "./suppression-reservation.js";

/** How screens and exports show a suppression reservation. */
export class SuppressionReservationView {
  codeText: string;
  label: string;
  quantity: string;
  discount: string;
  limit: string;
  sequence: string;
  updatedAt: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    quantity: string,
    discount: string,
    limit: string,
    sequence: string,
    updatedAt: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.quantity = quantity;
    this.discount = discount;
    this.limit = limit;
    this.sequence = sequence;
    this.updatedAt = updatedAt;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionReservationView(item: SuppressionReservation): SuppressionReservationView {
  return new SuppressionReservationView(
    text.truncate(item.code, 80),
    item.label,
    String(item.quantity),
    item.discount.toFixed(2),
    String(item.limit),
    String(item.sequence),
    String(item.updatedAt),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionReservationViews(items: SuppressionReservation[]): SuppressionReservationView[] {
  const views: SuppressionReservationView[] = [];
  for (const item of items) {
    views.push(toSuppressionReservationView(item));
  }
  return views;
}

export function sumSuppressionReservationView(view: SuppressionReservationView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedQuantity + parsedDiscount + parsedLimit;
}
