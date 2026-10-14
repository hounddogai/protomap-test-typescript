import * as text from "../../../../kit/text.js";
import { StepRecord } from "./step-record.js";

/** How screens and exports show a step record. */
export class StepRecordView {
  code: string;
  name: string;
  utmSource: string;
  maximum: string;
  ownerId: string;
  durationMinutes: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    maximum: string,
    ownerId: string,
    durationMinutes: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.maximum = maximum;
    this.ownerId = ownerId;
    this.durationMinutes = durationMinutes;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toStepRecordView(item: StepRecord): StepRecordView {
  return new StepRecordView(
    text.truncate(item.code, 80),
    item.name,
    item.utmSource,
    item.maximum.toFixed(2),
    text.truncate(item.ownerId, 64),
    String(item.durationMinutes),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepRecordViews(items: StepRecord[]): StepRecordView[] {
  const views: StepRecordView[] = [];
  for (const item of items) {
    views.push(toStepRecordView(item));
  }
  return views;
}

export function sumStepRecordView(view: StepRecordView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedMaximum + parsedDurationMinutes + parsedGraceDays;
}
