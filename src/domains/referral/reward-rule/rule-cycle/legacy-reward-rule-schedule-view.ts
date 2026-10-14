import * as text from "../../../../kit/text.js";
import { LegacyRewardRuleSchedule } from "./legacy-reward-rule-schedule.js";

/** How screens and exports show a legacy reward rule schedule. */
export class LegacyRewardRuleScheduleView {
  code: string;
  title: string;
  capacityText: string;
  ratio: string;
  minimum: string;
  channel: string;
  ceiling: string;
  country: string;
  revisionText: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    capacityText: string,
    ratio: string,
    minimum: string,
    channel: string,
    ceiling: string,
    country: string,
    revisionText: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.capacityText = capacityText;
    this.ratio = ratio;
    this.minimum = minimum;
    this.channel = channel;
    this.ceiling = ceiling;
    this.country = country;
    this.revisionText = revisionText;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyRewardRuleScheduleView(item: LegacyRewardRuleSchedule): LegacyRewardRuleScheduleView {
  return new LegacyRewardRuleScheduleView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 80),
    String(item.capacity),
    item.ratio.toFixed(2),
    item.minimum.toFixed(2),
    item.channel,
    item.ceiling.toFixed(2),
    item.country,
    String(item.revision),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyRewardRuleScheduleViews(items: LegacyRewardRuleSchedule[]): LegacyRewardRuleScheduleView[] {
  const views: LegacyRewardRuleScheduleView[] = [];
  for (const item of items) {
    views.push(toLegacyRewardRuleScheduleView(item));
  }
  return views;
}

export function sumLegacyRewardRuleScheduleView(view: LegacyRewardRuleScheduleView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedCapacity + parsedRatio + parsedMinimum;
}
