import * as text from "../../../../kit/text.js";
import { RegionalRewardRulePreference } from "./regional-reward-rule-preference.js";

/** How screens and exports show a regional reward rule preference. */
export class RegionalRewardRulePreferenceView {
  code: string;
  title: string;
  ratio: string;
  durationMinutesText: string;
  windowDaysText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ratio: string,
    durationMinutesText: string,
    windowDaysText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.durationMinutesText = durationMinutesText;
    this.windowDaysText = windowDaysText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalRewardRulePreferenceView(item: RegionalRewardRulePreference): RegionalRewardRulePreferenceView {
  return new RegionalRewardRulePreferenceView(
    text.truncate(item.code, 40),
    item.title,
    item.ratio.toFixed(2),
    String(item.durationMinutes),
    String(item.windowDays),
    text.truncate(item.channel, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalRewardRulePreferenceViews(items: RegionalRewardRulePreference[]): RegionalRewardRulePreferenceView[] {
  const views: RegionalRewardRulePreferenceView[] = [];
  for (const item of items) {
    views.push(toRegionalRewardRulePreferenceView(item));
  }
  return views;
}

export function sumRegionalRewardRulePreferenceView(view: RegionalRewardRulePreferenceView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedRatio + parsedDurationMinutes + parsedWindowDays;
}
