import * as text from "../../../../kit/text.js";
import { LenientDeflectionReservation } from "./lenient-deflection-reservation.js";

/** How screens and exports show a lenient deflection reservation. */
export class LenientDeflectionReservationView {
  code: string;
  label: string;
  category: string;
  locale: string;
  phone: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    category: string,
    locale: string,
    phone: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.locale = locale;
    this.phone = phone;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toLenientDeflectionReservationView(item: LenientDeflectionReservation): LenientDeflectionReservationView {
  return new LenientDeflectionReservationView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 64),
    item.category,
    item.locale,
    text.truncate(item.phone, 40),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientDeflectionReservationViews(items: LenientDeflectionReservation[]): LenientDeflectionReservationView[] {
  const views: LenientDeflectionReservationView[] = [];
  for (const item of items) {
    views.push(toLenientDeflectionReservationView(item));
  }
  return views;
}

export function sumLenientDeflectionReservationView(view: LenientDeflectionReservationView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
