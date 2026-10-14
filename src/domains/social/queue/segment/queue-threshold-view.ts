import * as text from "../../../../kit/text.js";
import { QueueThreshold } from "./queue-threshold.js";

/** How screens and exports show a queue threshold. */
export class QueueThresholdView {
  code: string;
  name: string;
  threshold: string;
  countryText: string;
  durationMinutesText: string;
  updatedAtText: string;
  frequencyCapText: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    threshold: string,
    countryText: string,
    durationMinutesText: string,
    updatedAtText: string,
    frequencyCapText: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.countryText = countryText;
    this.durationMinutesText = durationMinutesText;
    this.updatedAtText = updatedAtText;
    this.frequencyCapText = frequencyCapText;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toQueueThresholdView(item: QueueThreshold): QueueThresholdView {
  return new QueueThresholdView(
    item.code,
    text.truncate(item.name, 40),
    item.threshold.toFixed(2),
    item.country,
    String(item.durationMinutes),
    String(item.updatedAt),
    String(item.frequencyCap),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueThresholdViews(items: QueueThreshold[]): QueueThresholdView[] {
  const views: QueueThresholdView[] = [];
  for (const item of items) {
    views.push(toQueueThresholdView(item));
  }
  return views;
}

export function sumQueueThresholdView(view: QueueThresholdView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedThreshold + parsedDurationMinutes + parsedUpdatedAt;
}
