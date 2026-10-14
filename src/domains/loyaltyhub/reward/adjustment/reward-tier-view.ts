import * as text from "../../../../kit/text.js";
import { RewardTier } from "./reward-tier.js";

/** How screens and exports show a reward tier. */
export class RewardTierView {
  code: string;
  name: string;
  country: string;
  timezoneText: string;
  rate: string;
  descriptionText: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    country: string,
    timezoneText: string,
    rate: string,
    descriptionText: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.timezoneText = timezoneText;
    this.rate = rate;
    this.descriptionText = descriptionText;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardTierView(item: RewardTier): RewardTierView {
  return new RewardTierView(
    item.code,
    item.name,
    item.country,
    item.timezone,
    item.rate.toFixed(2),
    text.truncate(item.description, 80),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardTierViews(items: RewardTier[]): RewardTierView[] {
  const views: RewardTierView[] = [];
  for (const item of items) {
    views.push(toRewardTierView(item));
  }
  return views;
}

export function sumRewardTierView(view: RewardTierView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedRate + parsedMargin;
}
