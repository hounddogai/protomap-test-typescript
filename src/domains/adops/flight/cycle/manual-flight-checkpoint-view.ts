import * as text from "../../../../kit/text.js";
import { ManualFlightCheckpoint } from "./manual-flight-checkpoint.js";

/** How screens and exports show a manual flight checkpoint. */
export class ManualFlightCheckpointView {
  code: string;
  title: string;
  timezone: string;
  approved: string;
  contactEmail: string;
  campaignRef: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    timezone: string,
    approved: string,
    contactEmail: string,
    campaignRef: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.approved = approved;
    this.contactEmail = contactEmail;
    this.campaignRef = campaignRef;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toManualFlightCheckpointView(item: ManualFlightCheckpoint): ManualFlightCheckpointView {
  return new ManualFlightCheckpointView(
    item.code,
    item.title,
    text.truncate(item.timezone, 120),
    `${item.approved}`,
    item.contactEmail,
    item.campaignRef,
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualFlightCheckpointViews(items: ManualFlightCheckpoint[]): ManualFlightCheckpointView[] {
  const views: ManualFlightCheckpointView[] = [];
  for (const item of items) {
    views.push(toManualFlightCheckpointView(item));
  }
  return views;
}

export function sumManualFlightCheckpointView(view: ManualFlightCheckpointView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedDurationMinutes;
}
