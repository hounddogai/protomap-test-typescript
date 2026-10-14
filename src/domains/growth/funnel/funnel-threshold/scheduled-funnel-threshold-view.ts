import * as text from "../../../../kit/text.js";
import { ScheduledFunnelThreshold } from "./scheduled-funnel-threshold.js";

/** How screens and exports show a scheduled funnel threshold. */
export class ScheduledFunnelThresholdView {
  code: string;
  title: string;
  active: string;
  variant: string;
  pinnedText: string;
  cohortText: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    active: string,
    variant: string,
    pinnedText: string,
    cohortText: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.variant = variant;
    this.pinnedText = pinnedText;
    this.cohortText = cohortText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledFunnelThresholdView(item: ScheduledFunnelThreshold): ScheduledFunnelThresholdView {
  return new ScheduledFunnelThresholdView(
    item.code,
    item.title,
    `${item.active}`,
    item.variant,
    `${item.pinned}`,
    text.truncate(item.cohort, 64),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledFunnelThresholdViews(items: ScheduledFunnelThreshold[]): ScheduledFunnelThresholdView[] {
  const views: ScheduledFunnelThresholdView[] = [];
  for (const item of items) {
    views.push(toScheduledFunnelThresholdView(item));
  }
  return views;
}

export function sumScheduledFunnelThresholdView(view: ScheduledFunnelThresholdView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
