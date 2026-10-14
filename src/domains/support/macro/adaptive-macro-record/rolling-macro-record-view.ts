import * as text from "../../../../kit/text.js";
import { RollingMacroRecord } from "./rolling-macro-record.js";

/** How screens and exports show a rolling macro record. */
export class RollingMacroRecordView {
  code: string;
  nameText: string;
  priority: string;
  clicks: string;
  durationMinutesText: string;
  minimum: string;
  externalRef: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    priority: string,
    clicks: string,
    durationMinutesText: string,
    minimum: string,
    externalRef: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.priority = priority;
    this.clicks = clicks;
    this.durationMinutesText = durationMinutesText;
    this.minimum = minimum;
    this.externalRef = externalRef;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toRollingMacroRecordView(item: RollingMacroRecord): RollingMacroRecordView {
  return new RollingMacroRecordView(
    item.code,
    text.truncate(item.name, 80),
    String(item.priority),
    String(item.clicks),
    String(item.durationMinutes),
    item.minimum.toFixed(2),
    text.truncate(item.externalRef, 80),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingMacroRecordViews(items: RollingMacroRecord[]): RollingMacroRecordView[] {
  const views: RollingMacroRecordView[] = [];
  for (const item of items) {
    views.push(toRollingMacroRecordView(item));
  }
  return views;
}

export function sumRollingMacroRecordView(view: RollingMacroRecordView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedPriority + parsedClicks + parsedDurationMinutes;
}
