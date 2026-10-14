import * as text from "../../../../kit/text.js";
import { ManualLevelEntry } from "./manual-level-entry.js";

/** How screens and exports show a manual level entry. */
export class ManualLevelEntryView {
  code: string;
  label: string;
  active: string;
  pinned: string;
  timezone: string;
  sendAtText: string;
  graceDays: string;
  ratio: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    active: string,
    pinned: string,
    timezone: string,
    sendAtText: string,
    graceDays: string,
    ratio: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.pinned = pinned;
    this.timezone = timezone;
    this.sendAtText = sendAtText;
    this.graceDays = graceDays;
    this.ratio = ratio;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toManualLevelEntryView(item: ManualLevelEntry): ManualLevelEntryView {
  return new ManualLevelEntryView(
    item.code,
    item.label,
    `${item.active}`,
    `${item.pinned}`,
    text.truncate(item.timezone, 80),
    String(item.sendAt),
    String(item.graceDays),
    item.ratio.toFixed(2),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualLevelEntryViews(items: ManualLevelEntry[]): ManualLevelEntryView[] {
  const views: ManualLevelEntryView[] = [];
  for (const item of items) {
    views.push(toManualLevelEntryView(item));
  }
  return views;
}

export function sumManualLevelEntryView(view: ManualLevelEntryView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedSendAt + parsedGraceDays + parsedRatio;
}
