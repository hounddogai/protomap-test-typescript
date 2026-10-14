import { ScheduledFunnelSlot } from "./scheduled-funnel-slot.js";

/** How screens and exports show a scheduled funnel slot. */
export class ScheduledFunnelSlotView {
  code: string;
  title: string;
  description: string;
  reviewerText: string;
  updatedAt: string;
  active: string;
  limit: string;
  frequencyCapText: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    description: string,
    reviewerText: string,
    updatedAt: string,
    active: string,
    limit: string,
    frequencyCapText: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.reviewerText = reviewerText;
    this.updatedAt = updatedAt;
    this.active = active;
    this.limit = limit;
    this.frequencyCapText = frequencyCapText;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledFunnelSlotView(item: ScheduledFunnelSlot): ScheduledFunnelSlotView {
  return new ScheduledFunnelSlotView(
    item.code,
    item.title,
    item.description,
    item.reviewer,
    String(item.updatedAt),
    `${item.active}`,
    String(item.limit),
    String(item.frequencyCap),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledFunnelSlotViews(items: ScheduledFunnelSlot[]): ScheduledFunnelSlotView[] {
  const views: ScheduledFunnelSlotView[] = [];
  for (const item of items) {
    views.push(toScheduledFunnelSlotView(item));
  }
  return views;
}

export function sumScheduledFunnelSlotView(view: ScheduledFunnelSlotView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedUpdatedAt + parsedLimit + parsedFrequencyCap;
}
