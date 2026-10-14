import * as text from "../../../../kit/text.js";
import { LegacyWaitReservation } from "./legacy-wait-reservation.js";

/** How screens and exports show a legacy wait reservation. */
export class LegacyWaitReservationView {
  codeText: string;
  title: string;
  floorValueText: string;
  approvedText: string;
  audienceIdText: string;
  rateText: string;
  retries: string;
  utmSource: string;
  description: string;
  variantText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    floorValueText: string,
    approvedText: string,
    audienceIdText: string,
    rateText: string,
    retries: string,
    utmSource: string,
    description: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.floorValueText = floorValueText;
    this.approvedText = approvedText;
    this.audienceIdText = audienceIdText;
    this.rateText = rateText;
    this.retries = retries;
    this.utmSource = utmSource;
    this.description = description;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyWaitReservationView(item: LegacyWaitReservation): LegacyWaitReservationView {
  return new LegacyWaitReservationView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 120),
    item.floorValue.toFixed(2),
    `${item.approved}`,
    item.audienceId,
    item.rate.toFixed(2),
    String(item.retries),
    text.truncate(item.utmSource, 80),
    item.description,
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyWaitReservationViews(items: LegacyWaitReservation[]): LegacyWaitReservationView[] {
  const views: LegacyWaitReservationView[] = [];
  for (const item of items) {
    views.push(toLegacyWaitReservationView(item));
  }
  return views;
}

export function sumLegacyWaitReservationView(view: LegacyWaitReservationView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedFloorValue + parsedRate + parsedRetries;
}
