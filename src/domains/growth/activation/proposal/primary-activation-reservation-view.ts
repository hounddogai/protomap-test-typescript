import * as text from "../../../../kit/text.js";
import { PrimaryActivationReservation } from "./primary-activation-reservation.js";

/** How screens and exports show a primary activation reservation. */
export class PrimaryActivationReservationView {
  code: string;
  name: string;
  cohort: string;
  costText: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    cohort: string,
    costText: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.costText = costText;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryActivationReservationView(item: PrimaryActivationReservation): PrimaryActivationReservationView {
  return new PrimaryActivationReservationView(
    item.code,
    text.truncate(item.name, 80),
    text.truncate(item.cohort, 80),
    item.cost.toFixed(2),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryActivationReservationViews(items: PrimaryActivationReservation[]): PrimaryActivationReservationView[] {
  const views: PrimaryActivationReservationView[] = [];
  for (const item of items) {
    views.push(toPrimaryActivationReservationView(item));
  }
  return views;
}

export function sumPrimaryActivationReservationView(view: PrimaryActivationReservationView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedCost;
}
