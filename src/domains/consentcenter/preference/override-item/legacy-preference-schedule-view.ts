import * as text from "../../../../kit/text.js";
import { LegacyPreferenceSchedule } from "./legacy-preference-schedule.js";

/** How screens and exports show a legacy preference schedule. */
export class LegacyPreferenceScheduleView {
  codeText: string;
  name: string;
  title: string;
  startsAtText: string;
  channel: string;
  thresholdText: string;
  cost: string;
  discount: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    title: string,
    startsAtText: string,
    channel: string,
    thresholdText: string,
    cost: string,
    discount: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.title = title;
    this.startsAtText = startsAtText;
    this.channel = channel;
    this.thresholdText = thresholdText;
    this.cost = cost;
    this.discount = discount;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPreferenceScheduleView(item: LegacyPreferenceSchedule): LegacyPreferenceScheduleView {
  return new LegacyPreferenceScheduleView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 80),
    text.truncate(item.title, 120),
    String(item.startsAt),
    item.channel,
    item.threshold.toFixed(2),
    item.cost.toFixed(2),
    item.discount.toFixed(2),
    text.truncate(item.externalRef, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPreferenceScheduleViews(items: LegacyPreferenceSchedule[]): LegacyPreferenceScheduleView[] {
  const views: LegacyPreferenceScheduleView[] = [];
  for (const item of items) {
    views.push(toLegacyPreferenceScheduleView(item));
  }
  return views;
}

export function sumLegacyPreferenceScheduleView(view: LegacyPreferenceScheduleView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedStartsAt + parsedThreshold + parsedCost;
}
