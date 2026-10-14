import { LeaderboardDigest } from "./leaderboard-digest.js";

/** How screens and exports show a leaderboard digest. */
export class LeaderboardDigestView {
  code: string;
  name: string;
  archived: string;
  durationMinutes: string;
  campaignRef: string;
  variant: string;
  floorValue: string;
  segment: string;
  journeyId: string;
  windowDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    archived: string,
    durationMinutes: string,
    campaignRef: string,
    variant: string,
    floorValue: string,
    segment: string,
    journeyId: string,
    windowDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.durationMinutes = durationMinutes;
    this.campaignRef = campaignRef;
    this.variant = variant;
    this.floorValue = floorValue;
    this.segment = segment;
    this.journeyId = journeyId;
    this.windowDaysText = windowDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardDigestView(item: LeaderboardDigest): LeaderboardDigestView {
  return new LeaderboardDigestView(
    item.code,
    item.name,
    `${item.archived}`,
    String(item.durationMinutes),
    item.campaignRef,
    item.variant,
    item.floorValue.toFixed(2),
    item.segment,
    item.journeyId,
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardDigestViews(items: LeaderboardDigest[]): LeaderboardDigestView[] {
  const views: LeaderboardDigestView[] = [];
  for (const item of items) {
    views.push(toLeaderboardDigestView(item));
  }
  return views;
}

export function sumLeaderboardDigestView(view: LeaderboardDigestView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedDurationMinutes + parsedFloorValue + parsedWindowDays;
}
