import * as text from "../../../../kit/text.js";
import { ScheduledOptOutSlot } from "./scheduled-opt-out-slot.js";

/** How screens and exports show a scheduled opt out slot. */
export class ScheduledOptOutSlotView {
  codeText: string;
  nameText: string;
  expiresAt: string;
  notesText: string;
  unit: string;
  maximumText: string;
  localeText: string;
  timezone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    expiresAt: string,
    notesText: string,
    unit: string,
    maximumText: string,
    localeText: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.expiresAt = expiresAt;
    this.notesText = notesText;
    this.unit = unit;
    this.maximumText = maximumText;
    this.localeText = localeText;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledOptOutSlotView(item: ScheduledOptOutSlot): ScheduledOptOutSlotView {
  return new ScheduledOptOutSlotView(
    item.code,
    text.truncate(item.name, 40),
    String(item.expiresAt),
    item.notes,
    item.unit,
    item.maximum.toFixed(2),
    item.locale,
    text.truncate(item.timezone, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledOptOutSlotViews(items: ScheduledOptOutSlot[]): ScheduledOptOutSlotView[] {
  const views: ScheduledOptOutSlotView[] = [];
  for (const item of items) {
    views.push(toScheduledOptOutSlotView(item));
  }
  return views;
}

export function sumScheduledOptOutSlotView(view: ScheduledOptOutSlotView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedExpiresAt + parsedMaximum;
}
