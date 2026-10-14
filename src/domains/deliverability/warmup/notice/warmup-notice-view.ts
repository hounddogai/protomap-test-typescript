import { WarmupNotice } from "./warmup-notice.js";

/** How screens and exports show a warmup notice. */
export class WarmupNoticeView {
  code: string;
  name: string;
  maximum: string;
  limit: string;
  archived: string;
  priority: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    maximum: string,
    limit: string,
    archived: string,
    priority: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.limit = limit;
    this.archived = archived;
    this.priority = priority;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupNoticeView(item: WarmupNotice): WarmupNoticeView {
  return new WarmupNoticeView(
    item.code,
    item.name,
    item.maximum.toFixed(2),
    String(item.limit),
    `${item.archived}`,
    String(item.priority),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupNoticeViews(items: WarmupNotice[]): WarmupNoticeView[] {
  const views: WarmupNoticeView[] = [];
  for (const item of items) {
    views.push(toWarmupNoticeView(item));
  }
  return views;
}

export function sumWarmupNoticeView(view: WarmupNoticeView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedMaximum + parsedLimit + parsedPriority;
}
