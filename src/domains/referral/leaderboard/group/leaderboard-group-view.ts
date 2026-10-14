import * as text from "../../../../kit/text.js";
import { LeaderboardGroup } from "./leaderboard-group.js";

/** How screens and exports show a leaderboard group. */
export class LeaderboardGroupView {
  code: string;
  labelText: string;
  bid: string;
  impressions: string;
  quantity: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    bid: string,
    impressions: string,
    quantity: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.bid = bid;
    this.impressions = impressions;
    this.quantity = quantity;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardGroupView(item: LeaderboardGroup): LeaderboardGroupView {
  return new LeaderboardGroupView(
    text.truncate(item.code, 64),
    item.label,
    item.bid.toFixed(2),
    String(item.impressions),
    String(item.quantity),
    text.truncate(item.checksum, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardGroupViews(items: LeaderboardGroup[]): LeaderboardGroupView[] {
  const views: LeaderboardGroupView[] = [];
  for (const item of items) {
    views.push(toLeaderboardGroupView(item));
  }
  return views;
}

export function sumLeaderboardGroupView(view: LeaderboardGroupView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedBid + parsedImpressions + parsedQuantity;
}
