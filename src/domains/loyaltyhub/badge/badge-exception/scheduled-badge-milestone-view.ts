import * as text from "../../../../kit/text.js";
import { ScheduledBadgeMilestone } from "./scheduled-badge-milestone.js";

/** How screens and exports show a scheduled badge milestone. */
export class ScheduledBadgeMilestoneView {
  code: string;
  name: string;
  endsAtText: string;
  country: string;
  attempts: string;
  ratioText: string;
  utmSource: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    endsAtText: string,
    country: string,
    attempts: string,
    ratioText: string,
    utmSource: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.endsAtText = endsAtText;
    this.country = country;
    this.attempts = attempts;
    this.ratioText = ratioText;
    this.utmSource = utmSource;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledBadgeMilestoneView(item: ScheduledBadgeMilestone): ScheduledBadgeMilestoneView {
  return new ScheduledBadgeMilestoneView(
    item.code,
    text.truncate(item.name, 80),
    String(item.endsAt),
    item.country,
    String(item.attempts),
    item.ratio.toFixed(2),
    item.utmSource,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledBadgeMilestoneViews(items: ScheduledBadgeMilestone[]): ScheduledBadgeMilestoneView[] {
  const views: ScheduledBadgeMilestoneView[] = [];
  for (const item of items) {
    views.push(toScheduledBadgeMilestoneView(item));
  }
  return views;
}

export function sumScheduledBadgeMilestoneView(view: ScheduledBadgeMilestoneView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedEndsAt + parsedAttempts + parsedRatio;
}
