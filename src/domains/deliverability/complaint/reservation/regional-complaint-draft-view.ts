import * as text from "../../../../kit/text.js";
import { RegionalComplaintDraft } from "./regional-complaint-draft.js";

/** How screens and exports show a regional complaint draft. */
export class RegionalComplaintDraftView {
  code: string;
  label: string;
  floorValue: string;
  notesText: string;
  durationMinutes: string;
  phoneText: string;
  openRateText: string;
  locale: string;
  timezone: string;
  priority: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    floorValue: string,
    notesText: string,
    durationMinutes: string,
    phoneText: string,
    openRateText: string,
    locale: string,
    timezone: string,
    priority: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.notesText = notesText;
    this.durationMinutes = durationMinutes;
    this.phoneText = phoneText;
    this.openRateText = openRateText;
    this.locale = locale;
    this.timezone = timezone;
    this.priority = priority;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalComplaintDraftView(item: RegionalComplaintDraft): RegionalComplaintDraftView {
  return new RegionalComplaintDraftView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 40),
    item.floorValue.toFixed(2),
    text.truncate(item.notes, 120),
    String(item.durationMinutes),
    item.phone,
    item.openRate.toFixed(2),
    item.locale,
    item.timezone,
    String(item.priority),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalComplaintDraftViews(items: RegionalComplaintDraft[]): RegionalComplaintDraftView[] {
  const views: RegionalComplaintDraftView[] = [];
  for (const item of items) {
    views.push(toRegionalComplaintDraftView(item));
  }
  return views;
}

export function sumRegionalComplaintDraftView(view: RegionalComplaintDraftView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedFloorValue + parsedDurationMinutes + parsedOpenRate;
}
