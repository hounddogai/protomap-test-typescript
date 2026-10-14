import * as text from "../../../../kit/text.js";
import { ScheduledWindowTier } from "./scheduled-window-tier.js";

/** How screens and exports show a scheduled window tier. */
export class ScheduledWindowTierView {
  code: string;
  title: string;
  summary: string;
  expiresAtText: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    summary: string,
    expiresAtText: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.expiresAtText = expiresAtText;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledWindowTierView(item: ScheduledWindowTier): ScheduledWindowTierView {
  return new ScheduledWindowTierView(
    item.code,
    text.truncate(item.title, 120),
    text.truncate(item.summary, 64),
    String(item.expiresAt),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledWindowTierViews(items: ScheduledWindowTier[]): ScheduledWindowTierView[] {
  const views: ScheduledWindowTierView[] = [];
  for (const item of items) {
    views.push(toScheduledWindowTierView(item));
  }
  return views;
}

export function sumScheduledWindowTierView(view: ScheduledWindowTierView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedExpiresAt + parsedImpressions;
}
