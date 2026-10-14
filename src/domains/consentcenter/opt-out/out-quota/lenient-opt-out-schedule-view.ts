import * as text from "../../../../kit/text.js";
import { LenientOptOutSchedule } from "./lenient-opt-out-schedule.js";

/** How screens and exports show a lenient opt out schedule. */
export class LenientOptOutScheduleView {
  code: string;
  name: string;
  durationMinutes: string;
  limit: string;
  segment: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    durationMinutes: string,
    limit: string,
    segment: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.limit = limit;
    this.segment = segment;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientOptOutScheduleView(item: LenientOptOutSchedule): LenientOptOutScheduleView {
  return new LenientOptOutScheduleView(
    item.code,
    text.truncate(item.name, 64),
    String(item.durationMinutes),
    String(item.limit),
    item.segment,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientOptOutScheduleViews(items: LenientOptOutSchedule[]): LenientOptOutScheduleView[] {
  const views: LenientOptOutScheduleView[] = [];
  for (const item of items) {
    views.push(toLenientOptOutScheduleView(item));
  }
  return views;
}

export function sumLenientOptOutScheduleView(view: LenientOptOutScheduleView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedDurationMinutes + parsedLimit + parsedFrequencyCap;
}
