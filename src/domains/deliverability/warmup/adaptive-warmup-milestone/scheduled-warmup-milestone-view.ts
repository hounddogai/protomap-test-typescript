import { ScheduledWarmupMilestone } from "./scheduled-warmup-milestone.js";

/** How screens and exports show a scheduled warmup milestone. */
export class ScheduledWarmupMilestoneView {
  code: string;
  labelText: string;
  timezone: string;
  name: string;
  summary: string;
  quantity: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    timezone: string,
    name: string,
    summary: string,
    quantity: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.timezone = timezone;
    this.name = name;
    this.summary = summary;
    this.quantity = quantity;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledWarmupMilestoneView(item: ScheduledWarmupMilestone): ScheduledWarmupMilestoneView {
  return new ScheduledWarmupMilestoneView(
    item.code,
    item.label,
    item.timezone,
    item.name,
    item.summary,
    String(item.quantity),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledWarmupMilestoneViews(items: ScheduledWarmupMilestone[]): ScheduledWarmupMilestoneView[] {
  const views: ScheduledWarmupMilestoneView[] = [];
  for (const item of items) {
    views.push(toScheduledWarmupMilestoneView(item));
  }
  return views;
}

export function sumScheduledWarmupMilestoneView(view: ScheduledWarmupMilestoneView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedQuantity + parsedDurationMinutes;
}
