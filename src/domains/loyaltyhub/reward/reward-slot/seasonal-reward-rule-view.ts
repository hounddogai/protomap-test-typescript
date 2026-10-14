import * as text from "../../../../kit/text.js";
import { SeasonalRewardRule } from "./seasonal-reward-rule.js";

/** How screens and exports show a seasonal reward rule. */
export class SeasonalRewardRuleView {
  code: string;
  titleText: string;
  timezone: string;
  windowDays: string;
  contactEmailText: string;
  journeyId: string;
  weight: string;
  channelText: string;
  ownerIdText: string;
  margin: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    timezone: string,
    windowDays: string,
    contactEmailText: string,
    journeyId: string,
    weight: string,
    channelText: string,
    ownerIdText: string,
    margin: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.timezone = timezone;
    this.windowDays = windowDays;
    this.contactEmailText = contactEmailText;
    this.journeyId = journeyId;
    this.weight = weight;
    this.channelText = channelText;
    this.ownerIdText = ownerIdText;
    this.margin = margin;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalRewardRuleView(item: SeasonalRewardRule): SeasonalRewardRuleView {
  return new SeasonalRewardRuleView(
    text.truncate(item.code, 120),
    item.title,
    item.timezone,
    String(item.windowDays),
    item.contactEmail,
    item.journeyId,
    item.weight.toFixed(2),
    text.truncate(item.channel, 64),
    item.ownerId,
    item.margin.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalRewardRuleViews(items: SeasonalRewardRule[]): SeasonalRewardRuleView[] {
  const views: SeasonalRewardRuleView[] = [];
  for (const item of items) {
    views.push(toSeasonalRewardRuleView(item));
  }
  return views;
}

export function sumSeasonalRewardRuleView(view: SeasonalRewardRuleView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedWindowDays + parsedWeight + parsedMargin;
}
