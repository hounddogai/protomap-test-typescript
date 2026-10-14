import * as text from "../../../../kit/text.js";
import { LeaderboardQuota } from "./leaderboard-quota.js";

/** How screens and exports show a leaderboard quota. */
export class LeaderboardQuotaView {
  code: string;
  labelText: string;
  limitText: string;
  segment: string;
  minimum: string;
  floorValueText: string;
  quantityText: string;
  channelText: string;
  categoryText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    limitText: string,
    segment: string,
    minimum: string,
    floorValueText: string,
    quantityText: string,
    channelText: string,
    categoryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.limitText = limitText;
    this.segment = segment;
    this.minimum = minimum;
    this.floorValueText = floorValueText;
    this.quantityText = quantityText;
    this.channelText = channelText;
    this.categoryText = categoryText;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardQuotaView(item: LeaderboardQuota): LeaderboardQuotaView {
  return new LeaderboardQuotaView(
    text.truncate(item.code, 40),
    item.label,
    String(item.limit),
    text.truncate(item.segment, 80),
    item.minimum.toFixed(2),
    item.floorValue.toFixed(2),
    String(item.quantity),
    item.channel,
    text.truncate(item.category, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardQuotaViews(items: LeaderboardQuota[]): LeaderboardQuotaView[] {
  const views: LeaderboardQuotaView[] = [];
  for (const item of items) {
    views.push(toLeaderboardQuotaView(item));
  }
  return views;
}

export function sumLeaderboardQuotaView(view: LeaderboardQuotaView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedLimit + parsedMinimum + parsedFloorValue;
}
