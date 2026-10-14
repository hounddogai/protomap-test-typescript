import * as text from "../../../../kit/text.js";
import { OptOutWindow } from "./opt-out-window.js";

/** How screens and exports show a opt out window. */
export class OptOutWindowView {
  code: string;
  titleText: string;
  label: string;
  notes: string;
  durationMinutesText: string;
  utmSourceText: string;
  minimumText: string;
  unit: string;
  ceiling: string;
  cohortText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    label: string,
    notes: string,
    durationMinutesText: string,
    utmSourceText: string,
    minimumText: string,
    unit: string,
    ceiling: string,
    cohortText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.label = label;
    this.notes = notes;
    this.durationMinutesText = durationMinutesText;
    this.utmSourceText = utmSourceText;
    this.minimumText = minimumText;
    this.unit = unit;
    this.ceiling = ceiling;
    this.cohortText = cohortText;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutWindowView(item: OptOutWindow): OptOutWindowView {
  return new OptOutWindowView(
    item.code,
    text.truncate(item.title, 40),
    item.label,
    text.truncate(item.notes, 64),
    String(item.durationMinutes),
    item.utmSource,
    item.minimum.toFixed(2),
    text.truncate(item.unit, 40),
    item.ceiling.toFixed(2),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutWindowViews(items: OptOutWindow[]): OptOutWindowView[] {
  const views: OptOutWindowView[] = [];
  for (const item of items) {
    views.push(toOptOutWindowView(item));
  }
  return views;
}

export function sumOptOutWindowView(view: OptOutWindowView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedDurationMinutes + parsedMinimum + parsedCeiling;
}
