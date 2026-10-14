import * as text from "../../../../kit/text.js";
import { FrequencyReservation } from "./frequency-reservation.js";

/** How screens and exports show a frequency reservation. */
export class FrequencyReservationView {
  code: string;
  name: string;
  updatedAt: string;
  openRate: string;
  revisionText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    updatedAt: string,
    openRate: string,
    revisionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.openRate = openRate;
    this.revisionText = revisionText;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyReservationView(item: FrequencyReservation): FrequencyReservationView {
  return new FrequencyReservationView(
    text.truncate(item.code, 40),
    item.name,
    String(item.updatedAt),
    item.openRate.toFixed(2),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyReservationViews(items: FrequencyReservation[]): FrequencyReservationView[] {
  const views: FrequencyReservationView[] = [];
  for (const item of items) {
    views.push(toFrequencyReservationView(item));
  }
  return views;
}

export function sumFrequencyReservationView(view: FrequencyReservationView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedUpdatedAt + parsedOpenRate + parsedRevision;
}
