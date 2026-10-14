import { ScheduledFrequencyAdjustment } from "./scheduled-frequency-adjustment.js";

/** How screens and exports show a scheduled frequency adjustment. */
export class ScheduledFrequencyAdjustmentView {
  code: string;
  name: string;
  updatedAt: string;
  retries: string;
  createdAt: string;
  channel: string;
  limit: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    updatedAt: string,
    retries: string,
    createdAt: string,
    channel: string,
    limit: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.retries = retries;
    this.createdAt = createdAt;
    this.channel = channel;
    this.limit = limit;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledFrequencyAdjustmentView(item: ScheduledFrequencyAdjustment): ScheduledFrequencyAdjustmentView {
  return new ScheduledFrequencyAdjustmentView(
    item.code,
    item.name,
    String(item.updatedAt),
    String(item.retries),
    String(item.createdAt),
    item.channel,
    String(item.limit),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledFrequencyAdjustmentViews(items: ScheduledFrequencyAdjustment[]): ScheduledFrequencyAdjustmentView[] {
  const views: ScheduledFrequencyAdjustmentView[] = [];
  for (const item of items) {
    views.push(toScheduledFrequencyAdjustmentView(item));
  }
  return views;
}

export function sumScheduledFrequencyAdjustmentView(view: ScheduledFrequencyAdjustmentView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedUpdatedAt + parsedRetries + parsedCreatedAt;
}
