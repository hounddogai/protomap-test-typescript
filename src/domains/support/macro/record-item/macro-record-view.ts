import * as text from "../../../../kit/text.js";
import { MacroRecord } from "./macro-record.js";

/** How screens and exports show a macro record. */
export class MacroRecordView {
  code: string;
  label: string;
  summary: string;
  externalRef: string;
  timezoneText: string;
  region: string;
  windowDays: string;
  locale: string;
  segment: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    summary: string,
    externalRef: string,
    timezoneText: string,
    region: string,
    windowDays: string,
    locale: string,
    segment: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.externalRef = externalRef;
    this.timezoneText = timezoneText;
    this.region = region;
    this.windowDays = windowDays;
    this.locale = locale;
    this.segment = segment;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toMacroRecordView(item: MacroRecord): MacroRecordView {
  return new MacroRecordView(
    item.code,
    item.label,
    item.summary,
    item.externalRef,
    item.timezone,
    item.region,
    String(item.windowDays),
    text.truncate(item.locale, 80),
    item.segment,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroRecordViews(items: MacroRecord[]): MacroRecordView[] {
  const views: MacroRecordView[] = [];
  for (const item of items) {
    views.push(toMacroRecordView(item));
  }
  return views;
}

export function sumMacroRecordView(view: MacroRecordView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedWindowDays + parsedCreatedAt;
}
