import * as text from "../../../../kit/text.js";
import { FunnelNotice } from "./funnel-notice.js";

/** How screens and exports show a funnel notice. */
export class FunnelNoticeView {
  code: string;
  name: string;
  minimum: string;
  threshold: string;
  region: string;
  updatedAt: string;
  active: string;
  clicks: string;
  notesText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    minimum: string,
    threshold: string,
    region: string,
    updatedAt: string,
    active: string,
    clicks: string,
    notesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.threshold = threshold;
    this.region = region;
    this.updatedAt = updatedAt;
    this.active = active;
    this.clicks = clicks;
    this.notesText = notesText;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelNoticeView(item: FunnelNotice): FunnelNoticeView {
  return new FunnelNoticeView(
    text.truncate(item.code, 80),
    item.name,
    item.minimum.toFixed(2),
    item.threshold.toFixed(2),
    text.truncate(item.region, 120),
    String(item.updatedAt),
    `${item.active}`,
    String(item.clicks),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelNoticeViews(items: FunnelNotice[]): FunnelNoticeView[] {
  const views: FunnelNoticeView[] = [];
  for (const item of items) {
    views.push(toFunnelNoticeView(item));
  }
  return views;
}

export function sumFunnelNoticeView(view: FunnelNoticeView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedMinimum + parsedThreshold + parsedUpdatedAt;
}
