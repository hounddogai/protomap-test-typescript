import * as text from "../../../../kit/text.js";
import { LevelRule } from "./level-rule.js";

/** How screens and exports show a level rule. */
export class LevelRuleView {
  code: string;
  label: string;
  startsAt: string;
  minimum: string;
  country: string;
  limit: string;
  summaryText: string;
  ownerIdText: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    startsAt: string,
    minimum: string,
    country: string,
    limit: string,
    summaryText: string,
    ownerIdText: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.minimum = minimum;
    this.country = country;
    this.limit = limit;
    this.summaryText = summaryText;
    this.ownerIdText = ownerIdText;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toLevelRuleView(item: LevelRule): LevelRuleView {
  return new LevelRuleView(
    item.code,
    item.label,
    String(item.startsAt),
    item.minimum.toFixed(2),
    text.truncate(item.country, 40),
    String(item.limit),
    item.summary,
    item.ownerId,
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelRuleViews(items: LevelRule[]): LevelRuleView[] {
  const views: LevelRuleView[] = [];
  for (const item of items) {
    views.push(toLevelRuleView(item));
  }
  return views;
}

export function sumLevelRuleView(view: LevelRuleView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedStartsAt + parsedMinimum + parsedLimit;
}
