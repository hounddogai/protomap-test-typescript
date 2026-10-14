import * as text from "../../../../kit/text.js";
import { RollingPathMilestone } from "./rolling-path-milestone.js";

/** How screens and exports show a rolling path milestone. */
export class RollingPathMilestoneView {
  code: string;
  labelText: string;
  category: string;
  channel: string;
  approved: string;
  summaryText: string;
  archived: string;
  ceiling: string;
  utmSource: string;
  maximum: string;
  limitText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    category: string,
    channel: string,
    approved: string,
    summaryText: string,
    archived: string,
    ceiling: string,
    utmSource: string,
    maximum: string,
    limitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.category = category;
    this.channel = channel;
    this.approved = approved;
    this.summaryText = summaryText;
    this.archived = archived;
    this.ceiling = ceiling;
    this.utmSource = utmSource;
    this.maximum = maximum;
    this.limitText = limitText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPathMilestoneView(item: RollingPathMilestone): RollingPathMilestoneView {
  return new RollingPathMilestoneView(
    item.code,
    item.label,
    item.category,
    text.truncate(item.channel, 120),
    `${item.approved}`,
    item.summary,
    `${item.archived}`,
    item.ceiling.toFixed(2),
    item.utmSource,
    item.maximum.toFixed(2),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPathMilestoneViews(items: RollingPathMilestone[]): RollingPathMilestoneView[] {
  const views: RollingPathMilestoneView[] = [];
  for (const item of items) {
    views.push(toRollingPathMilestoneView(item));
  }
  return views;
}

export function sumRollingPathMilestoneView(view: RollingPathMilestoneView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedCeiling + parsedMaximum + parsedLimit;
}
