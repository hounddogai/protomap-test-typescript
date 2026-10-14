import * as text from "../../../../kit/text.js";
import { LeaderboardSchedule } from "./leaderboard-schedule.js";

/** How screens and exports show a leaderboard schedule. */
export class LeaderboardScheduleView {
  code: string;
  label: string;
  revision: string;
  bidText: string;
  rate: string;
  floorValue: string;
  priority: string;
  versionText: string;
  archived: string;
  campaignRef: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    revision: string,
    bidText: string,
    rate: string,
    floorValue: string,
    priority: string,
    versionText: string,
    archived: string,
    campaignRef: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.bidText = bidText;
    this.rate = rate;
    this.floorValue = floorValue;
    this.priority = priority;
    this.versionText = versionText;
    this.archived = archived;
    this.campaignRef = campaignRef;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardScheduleView(item: LeaderboardSchedule): LeaderboardScheduleView {
  return new LeaderboardScheduleView(
    item.code,
    item.label,
    String(item.revision),
    item.bid.toFixed(2),
    item.rate.toFixed(2),
    item.floorValue.toFixed(2),
    String(item.priority),
    String(item.version),
    `${item.archived}`,
    text.truncate(item.campaignRef, 120),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardScheduleViews(items: LeaderboardSchedule[]): LeaderboardScheduleView[] {
  const views: LeaderboardScheduleView[] = [];
  for (const item of items) {
    views.push(toLeaderboardScheduleView(item));
  }
  return views;
}

export function sumLeaderboardScheduleView(view: LeaderboardScheduleView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRevision + parsedBid + parsedRate;
}
