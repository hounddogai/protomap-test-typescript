import * as text from "../../../../kit/text.js";
import { InsightSchedule } from "./insight-schedule.js";

/** How screens and exports show a insight schedule. */
export class InsightScheduleView {
  code: string;
  label: string;
  channelText: string;
  thresholdText: string;
  reviewer: string;
  durationMinutes: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channelText: string,
    thresholdText: string,
    reviewer: string,
    durationMinutes: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channelText = channelText;
    this.thresholdText = thresholdText;
    this.reviewer = reviewer;
    this.durationMinutes = durationMinutes;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toInsightScheduleView(item: InsightSchedule): InsightScheduleView {
  return new InsightScheduleView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 64),
    text.truncate(item.channel, 64),
    item.threshold.toFixed(2),
    text.truncate(item.reviewer, 64),
    String(item.durationMinutes),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightScheduleViews(items: InsightSchedule[]): InsightScheduleView[] {
  const views: InsightScheduleView[] = [];
  for (const item of items) {
    views.push(toInsightScheduleView(item));
  }
  return views;
}

export function sumInsightScheduleView(view: InsightScheduleView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedThreshold + parsedDurationMinutes + parsedBatchSize;
}
