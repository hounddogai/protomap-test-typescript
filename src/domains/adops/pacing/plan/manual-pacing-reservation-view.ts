import * as text from "../../../../kit/text.js";
import { ManualPacingReservation } from "./manual-pacing-reservation.js";

/** How screens and exports show a manual pacing reservation. */
export class ManualPacingReservationView {
  code: string;
  title: string;
  openRate: string;
  durationMinutes: string;
  source: string;
  revision: string;
  capacity: string;
  timezoneText: string;
  summary: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    openRate: string,
    durationMinutes: string,
    source: string,
    revision: string,
    capacity: string,
    timezoneText: string,
    summary: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.durationMinutes = durationMinutes;
    this.source = source;
    this.revision = revision;
    this.capacity = capacity;
    this.timezoneText = timezoneText;
    this.summary = summary;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toManualPacingReservationView(item: ManualPacingReservation): ManualPacingReservationView {
  return new ManualPacingReservationView(
    text.truncate(item.code, 80),
    item.title,
    item.openRate.toFixed(2),
    String(item.durationMinutes),
    item.source,
    String(item.revision),
    String(item.capacity),
    item.timezone,
    text.truncate(item.summary, 80),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPacingReservationViews(items: ManualPacingReservation[]): ManualPacingReservationView[] {
  const views: ManualPacingReservationView[] = [];
  for (const item of items) {
    views.push(toManualPacingReservationView(item));
  }
  return views;
}

export function sumManualPacingReservationView(view: ManualPacingReservationView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedOpenRate + parsedDurationMinutes + parsedRevision;
}
