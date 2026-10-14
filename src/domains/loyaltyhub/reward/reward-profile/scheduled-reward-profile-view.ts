import * as text from "../../../../kit/text.js";
import { ScheduledRewardProfile } from "./scheduled-reward-profile.js";

/** How screens and exports show a scheduled reward profile. */
export class ScheduledRewardProfileView {
  code: string;
  label: string;
  margin: string;
  reviewer: string;
  segmentText: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    margin: string,
    reviewer: string,
    segmentText: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.reviewer = reviewer;
    this.segmentText = segmentText;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledRewardProfileView(item: ScheduledRewardProfile): ScheduledRewardProfileView {
  return new ScheduledRewardProfileView(
    item.code,
    text.truncate(item.label, 120),
    item.margin.toFixed(2),
    text.truncate(item.reviewer, 64),
    item.segment,
    text.truncate(item.variant, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledRewardProfileViews(items: ScheduledRewardProfile[]): ScheduledRewardProfileView[] {
  const views: ScheduledRewardProfileView[] = [];
  for (const item of items) {
    views.push(toScheduledRewardProfileView(item));
  }
  return views;
}

export function sumScheduledRewardProfileView(view: ScheduledRewardProfileView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedMargin;
}
