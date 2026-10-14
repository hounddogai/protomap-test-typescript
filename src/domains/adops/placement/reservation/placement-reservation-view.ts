import * as text from "../../../../kit/text.js";
import { PlacementReservation } from "./placement-reservation.js";

/** How screens and exports show a placement reservation. */
export class PlacementReservationView {
  code: string;
  label: string;
  updatedAt: string;
  active: string;
  amount: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    updatedAt: string,
    active: string,
    amount: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.active = active;
    this.amount = amount;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementReservationView(item: PlacementReservation): PlacementReservationView {
  return new PlacementReservationView(
    item.code,
    item.label,
    String(item.updatedAt),
    `${item.active}`,
    item.amount.toFixed(2),
    text.truncate(item.source, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementReservationViews(items: PlacementReservation[]): PlacementReservationView[] {
  const views: PlacementReservationView[] = [];
  for (const item of items) {
    views.push(toPlacementReservationView(item));
  }
  return views;
}

export function sumPlacementReservationView(view: PlacementReservationView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedUpdatedAt + parsedAmount;
}
