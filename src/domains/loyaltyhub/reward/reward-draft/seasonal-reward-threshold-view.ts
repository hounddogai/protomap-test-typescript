import * as text from "../../../../kit/text.js";
import { SeasonalRewardThreshold } from "./seasonal-reward-threshold.js";

/** How screens and exports show a seasonal reward threshold. */
export class SeasonalRewardThresholdView {
  code: string;
  nameText: string;
  updatedAt: string;
  countryText: string;
  channel: string;
  limit: string;
  priority: string;
  utmSourceText: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    updatedAt: string,
    countryText: string,
    channel: string,
    limit: string,
    priority: string,
    utmSourceText: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.updatedAt = updatedAt;
    this.countryText = countryText;
    this.channel = channel;
    this.limit = limit;
    this.priority = priority;
    this.utmSourceText = utmSourceText;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalRewardThresholdView(item: SeasonalRewardThreshold): SeasonalRewardThresholdView {
  return new SeasonalRewardThresholdView(
    item.code,
    text.truncate(item.name, 64),
    String(item.updatedAt),
    text.truncate(item.country, 64),
    item.channel,
    String(item.limit),
    String(item.priority),
    item.utmSource,
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalRewardThresholdViews(items: SeasonalRewardThreshold[]): SeasonalRewardThresholdView[] {
  const views: SeasonalRewardThresholdView[] = [];
  for (const item of items) {
    views.push(toSeasonalRewardThresholdView(item));
  }
  return views;
}

export function sumSeasonalRewardThresholdView(view: SeasonalRewardThresholdView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedUpdatedAt + parsedLimit + parsedPriority;
}
