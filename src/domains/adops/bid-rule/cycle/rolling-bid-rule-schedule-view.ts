import * as text from "../../../../kit/text.js";
import { RollingBidRuleSchedule } from "./rolling-bid-rule-schedule.js";

/** How screens and exports show a rolling bid rule schedule. */
export class RollingBidRuleScheduleView {
  code: string;
  name: string;
  version: string;
  margin: string;
  createdAt: string;
  revision: string;
  categoryText: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    version: string,
    margin: string,
    createdAt: string,
    revision: string,
    categoryText: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.margin = margin;
    this.createdAt = createdAt;
    this.revision = revision;
    this.categoryText = categoryText;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toRollingBidRuleScheduleView(item: RollingBidRuleSchedule): RollingBidRuleScheduleView {
  return new RollingBidRuleScheduleView(
    item.code,
    item.name,
    String(item.version),
    item.margin.toFixed(2),
    String(item.createdAt),
    String(item.revision),
    text.truncate(item.category, 80),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingBidRuleScheduleViews(items: RollingBidRuleSchedule[]): RollingBidRuleScheduleView[] {
  const views: RollingBidRuleScheduleView[] = [];
  for (const item of items) {
    views.push(toRollingBidRuleScheduleView(item));
  }
  return views;
}

export function sumRollingBidRuleScheduleView(view: RollingBidRuleScheduleView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedVersion + parsedMargin + parsedCreatedAt;
}
