import { ScheduledInsightThreshold } from "./scheduled-insight-threshold.js";

/** How screens and exports show a scheduled insight threshold. */
export class ScheduledInsightThresholdView {
  code: string;
  nameText: string;
  createdAt: string;
  durationMinutes: string;
  minimumText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    createdAt: string,
    durationMinutes: string,
    minimumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.createdAt = createdAt;
    this.durationMinutes = durationMinutes;
    this.minimumText = minimumText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledInsightThresholdView(item: ScheduledInsightThreshold): ScheduledInsightThresholdView {
  return new ScheduledInsightThresholdView(
    item.code,
    item.name,
    String(item.createdAt),
    String(item.durationMinutes),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledInsightThresholdViews(items: ScheduledInsightThreshold[]): ScheduledInsightThresholdView[] {
  const views: ScheduledInsightThresholdView[] = [];
  for (const item of items) {
    views.push(toScheduledInsightThresholdView(item));
  }
  return views;
}

export function sumScheduledInsightThresholdView(view: ScheduledInsightThresholdView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedCreatedAt + parsedDurationMinutes + parsedMinimum;
}
