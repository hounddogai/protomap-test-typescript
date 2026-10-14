import * as text from "../../../../kit/text.js";
import { ScheduledFunnelCheckpoint } from "./scheduled-funnel-checkpoint.js";

/** How screens and exports show a scheduled funnel checkpoint. */
export class ScheduledFunnelCheckpointView {
  code: string;
  label: string;
  floorValueText: string;
  notesText: string;
  locale: string;
  marginText: string;
  descriptionText: string;
  timezone: string;
  expiresAt: string;
  cohort: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    floorValueText: string,
    notesText: string,
    locale: string,
    marginText: string,
    descriptionText: string,
    timezone: string,
    expiresAt: string,
    cohort: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.floorValueText = floorValueText;
    this.notesText = notesText;
    this.locale = locale;
    this.marginText = marginText;
    this.descriptionText = descriptionText;
    this.timezone = timezone;
    this.expiresAt = expiresAt;
    this.cohort = cohort;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledFunnelCheckpointView(item: ScheduledFunnelCheckpoint): ScheduledFunnelCheckpointView {
  return new ScheduledFunnelCheckpointView(
    item.code,
    item.label,
    item.floorValue.toFixed(2),
    item.notes,
    item.locale,
    item.margin.toFixed(2),
    item.description,
    text.truncate(item.timezone, 64),
    String(item.expiresAt),
    item.cohort,
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledFunnelCheckpointViews(items: ScheduledFunnelCheckpoint[]): ScheduledFunnelCheckpointView[] {
  const views: ScheduledFunnelCheckpointView[] = [];
  for (const item of items) {
    views.push(toScheduledFunnelCheckpointView(item));
  }
  return views;
}

export function sumScheduledFunnelCheckpointView(view: ScheduledFunnelCheckpointView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedFloorValue + parsedMargin + parsedExpiresAt;
}
