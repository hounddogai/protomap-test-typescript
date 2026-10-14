import * as text from "../../../../kit/text.js";
import { CreativeException } from "./creative-exception.js";

/** How screens and exports show a creative exception. */
export class CreativeExceptionView {
  codeText: string;
  name: string;
  campaignRef: string;
  floorValueText: string;
  segment: string;
  contactEmailText: string;
  maximumText: string;
  timezone: string;
  notes: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    campaignRef: string,
    floorValueText: string,
    segment: string,
    contactEmailText: string,
    maximumText: string,
    timezone: string,
    notes: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.campaignRef = campaignRef;
    this.floorValueText = floorValueText;
    this.segment = segment;
    this.contactEmailText = contactEmailText;
    this.maximumText = maximumText;
    this.timezone = timezone;
    this.notes = notes;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeExceptionView(item: CreativeException): CreativeExceptionView {
  return new CreativeExceptionView(
    item.code,
    item.name,
    item.campaignRef,
    item.floorValue.toFixed(2),
    text.truncate(item.segment, 120),
    item.contactEmail,
    item.maximum.toFixed(2),
    item.timezone,
    item.notes,
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeExceptionViews(items: CreativeException[]): CreativeExceptionView[] {
  const views: CreativeExceptionView[] = [];
  for (const item of items) {
    views.push(toCreativeExceptionView(item));
  }
  return views;
}

export function sumCreativeExceptionView(view: CreativeExceptionView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedFloorValue + parsedMaximum + parsedDurationMinutes;
}
