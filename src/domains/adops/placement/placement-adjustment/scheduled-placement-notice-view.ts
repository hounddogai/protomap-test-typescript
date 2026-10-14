import * as text from "../../../../kit/text.js";
import { ScheduledPlacementNotice } from "./scheduled-placement-notice.js";

/** How screens and exports show a scheduled placement notice. */
export class ScheduledPlacementNoticeView {
  code: string;
  label: string;
  variant: string;
  reviewerText: string;
  weightText: string;
  journeyId: string;
  createdAt: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    variant: string,
    reviewerText: string,
    weightText: string,
    journeyId: string,
    createdAt: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.reviewerText = reviewerText;
    this.weightText = weightText;
    this.journeyId = journeyId;
    this.createdAt = createdAt;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledPlacementNoticeView(item: ScheduledPlacementNotice): ScheduledPlacementNoticeView {
  return new ScheduledPlacementNoticeView(
    item.code,
    text.truncate(item.label, 80),
    text.truncate(item.variant, 120),
    item.reviewer,
    item.weight.toFixed(2),
    text.truncate(item.journeyId, 40),
    String(item.createdAt),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledPlacementNoticeViews(items: ScheduledPlacementNotice[]): ScheduledPlacementNoticeView[] {
  const views: ScheduledPlacementNoticeView[] = [];
  for (const item of items) {
    views.push(toScheduledPlacementNoticeView(item));
  }
  return views;
}

export function sumScheduledPlacementNoticeView(view: ScheduledPlacementNoticeView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedWeight + parsedCreatedAt + parsedDurationMinutes;
}
