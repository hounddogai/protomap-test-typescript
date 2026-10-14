import * as text from "../../../../kit/text.js";
import { RewardRuleWindow } from "./reward-rule-window.js";

/** How screens and exports show a reward rule window. */
export class RewardRuleWindowView {
  code: string;
  name: string;
  notesText: string;
  clicks: string;
  windowDaysText: string;
  ratio: string;
  externalRefText: string;
  cohort: string;
  channel: string;
  source: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    notesText: string,
    clicks: string,
    windowDaysText: string,
    ratio: string,
    externalRefText: string,
    cohort: string,
    channel: string,
    source: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.notesText = notesText;
    this.clicks = clicks;
    this.windowDaysText = windowDaysText;
    this.ratio = ratio;
    this.externalRefText = externalRefText;
    this.cohort = cohort;
    this.channel = channel;
    this.source = source;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleWindowView(item: RewardRuleWindow): RewardRuleWindowView {
  return new RewardRuleWindowView(
    item.code,
    text.truncate(item.name, 64),
    item.notes,
    String(item.clicks),
    String(item.windowDays),
    item.ratio.toFixed(2),
    item.externalRef,
    item.cohort,
    item.channel,
    item.source,
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleWindowViews(items: RewardRuleWindow[]): RewardRuleWindowView[] {
  const views: RewardRuleWindowView[] = [];
  for (const item of items) {
    views.push(toRewardRuleWindowView(item));
  }
  return views;
}

export function sumRewardRuleWindowView(view: RewardRuleWindowView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedClicks + parsedWindowDays + parsedRatio;
}
