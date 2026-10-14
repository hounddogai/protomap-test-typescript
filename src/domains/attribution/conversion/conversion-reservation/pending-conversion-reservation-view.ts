import * as text from "../../../../kit/text.js";
import { PendingConversionReservation } from "./pending-conversion-reservation.js";

/** How screens and exports show a pending conversion reservation. */
export class PendingConversionReservationView {
  code: string;
  labelText: string;
  segmentText: string;
  threshold: string;
  endsAtText: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    segmentText: string,
    threshold: string,
    endsAtText: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.segmentText = segmentText;
    this.threshold = threshold;
    this.endsAtText = endsAtText;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toPendingConversionReservationView(item: PendingConversionReservation): PendingConversionReservationView {
  return new PendingConversionReservationView(
    text.truncate(item.code, 64),
    item.label,
    item.segment,
    item.threshold.toFixed(2),
    String(item.endsAt),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingConversionReservationViews(items: PendingConversionReservation[]): PendingConversionReservationView[] {
  const views: PendingConversionReservationView[] = [];
  for (const item of items) {
    views.push(toPendingConversionReservationView(item));
  }
  return views;
}

export function sumPendingConversionReservationView(view: PendingConversionReservationView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedThreshold + parsedEndsAt + parsedMargin;
}
