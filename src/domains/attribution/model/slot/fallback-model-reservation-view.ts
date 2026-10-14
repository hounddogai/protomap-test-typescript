import * as text from "../../../../kit/text.js";
import { FallbackModelReservation } from "./fallback-model-reservation.js";

/** How screens and exports show a fallback model reservation. */
export class FallbackModelReservationView {
  code: string;
  label: string;
  sequence: string;
  graceDays: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sequence: string,
    graceDays: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.graceDays = graceDays;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackModelReservationView(item: FallbackModelReservation): FallbackModelReservationView {
  return new FallbackModelReservationView(
    text.truncate(item.code, 80),
    item.label,
    String(item.sequence),
    String(item.graceDays),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackModelReservationViews(items: FallbackModelReservation[]): FallbackModelReservationView[] {
  const views: FallbackModelReservationView[] = [];
  for (const item of items) {
    views.push(toFallbackModelReservationView(item));
  }
  return views;
}

export function sumFallbackModelReservationView(view: FallbackModelReservationView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedSequence + parsedGraceDays + parsedMargin;
}
