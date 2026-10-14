import * as text from "../../../../kit/text.js";
import { ManualDeflectionReservation } from "./manual-deflection-reservation.js";

/** How screens and exports show a manual deflection reservation. */
export class ManualDeflectionReservationView {
  codeText: string;
  titleText: string;
  minimum: string;
  impressions: string;
  checksum: string;
  variantText: string;
  attempts: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    minimum: string,
    impressions: string,
    checksum: string,
    variantText: string,
    attempts: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.minimum = minimum;
    this.impressions = impressions;
    this.checksum = checksum;
    this.variantText = variantText;
    this.attempts = attempts;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toManualDeflectionReservationView(item: ManualDeflectionReservation): ManualDeflectionReservationView {
  return new ManualDeflectionReservationView(
    item.code,
    text.truncate(item.title, 40),
    item.minimum.toFixed(2),
    String(item.impressions),
    item.checksum,
    item.variant,
    String(item.attempts),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualDeflectionReservationViews(items: ManualDeflectionReservation[]): ManualDeflectionReservationView[] {
  const views: ManualDeflectionReservationView[] = [];
  for (const item of items) {
    views.push(toManualDeflectionReservationView(item));
  }
  return views;
}

export function sumManualDeflectionReservationView(view: ManualDeflectionReservationView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedMinimum + parsedImpressions + parsedAttempts;
}
