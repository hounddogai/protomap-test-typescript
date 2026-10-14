import * as text from "../../../../kit/text.js";
import { DeflectionReservation } from "./deflection-reservation.js";

/** How screens and exports show a deflection reservation. */
export class DeflectionReservationView {
  codeText: string;
  label: string;
  nameText: string;
  attempts: string;
  visible: string;
  approved: string;
  ratioText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    nameText: string,
    attempts: string,
    visible: string,
    approved: string,
    ratioText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.nameText = nameText;
    this.attempts = attempts;
    this.visible = visible;
    this.approved = approved;
    this.ratioText = ratioText;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionReservationView(item: DeflectionReservation): DeflectionReservationView {
  return new DeflectionReservationView(
    text.truncate(item.code, 40),
    item.label,
    item.name,
    String(item.attempts),
    `${item.visible}`,
    `${item.approved}`,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionReservationViews(items: DeflectionReservation[]): DeflectionReservationView[] {
  const views: DeflectionReservationView[] = [];
  for (const item of items) {
    views.push(toDeflectionReservationView(item));
  }
  return views;
}

export function sumDeflectionReservationView(view: DeflectionReservationView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedAttempts + parsedRatio;
}
