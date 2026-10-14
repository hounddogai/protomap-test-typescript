import * as text from "../../../../kit/text.js";
import { PacingReservation } from "./pacing-reservation.js";

/** How screens and exports show a pacing reservation. */
export class PacingReservationView {
  code: string;
  label: string;
  sequence: string;
  impressions: string;
  retries: string;
  summary: string;
  region: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sequence: string,
    impressions: string,
    retries: string,
    summary: string,
    region: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.impressions = impressions;
    this.retries = retries;
    this.summary = summary;
    this.region = region;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toPacingReservationView(item: PacingReservation): PacingReservationView {
  return new PacingReservationView(
    item.code,
    text.truncate(item.label, 40),
    String(item.sequence),
    String(item.impressions),
    String(item.retries),
    item.summary,
    item.region,
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingReservationViews(items: PacingReservation[]): PacingReservationView[] {
  const views: PacingReservationView[] = [];
  for (const item of items) {
    views.push(toPacingReservationView(item));
  }
  return views;
}

export function sumPacingReservationView(view: PacingReservationView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedSequence + parsedImpressions + parsedRetries;
}
