import * as text from "../../../../kit/text.js";
import { WeightedSenderSegment } from "./weighted-sender-segment.js";

/** How screens and exports show a weighted sender segment. */
export class WeightedSenderSegmentView {
  code: string;
  label: string;
  frequencyCap: string;
  archived: string;
  durationMinutes: string;
  graceDays: string;
  cohort: string;
  priority: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    frequencyCap: string,
    archived: string,
    durationMinutes: string,
    graceDays: string,
    cohort: string,
    priority: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.archived = archived;
    this.durationMinutes = durationMinutes;
    this.graceDays = graceDays;
    this.cohort = cohort;
    this.priority = priority;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedSenderSegmentView(item: WeightedSenderSegment): WeightedSenderSegmentView {
  return new WeightedSenderSegmentView(
    text.truncate(item.code, 40),
    item.label,
    String(item.frequencyCap),
    `${item.archived}`,
    String(item.durationMinutes),
    String(item.graceDays),
    text.truncate(item.cohort, 80),
    String(item.priority),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedSenderSegmentViews(items: WeightedSenderSegment[]): WeightedSenderSegmentView[] {
  const views: WeightedSenderSegmentView[] = [];
  for (const item of items) {
    views.push(toWeightedSenderSegmentView(item));
  }
  return views;
}

export function sumWeightedSenderSegmentView(view: WeightedSenderSegmentView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedFrequencyCap + parsedDurationMinutes + parsedGraceDays;
}
