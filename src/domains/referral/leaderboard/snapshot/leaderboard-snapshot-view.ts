import * as text from "../../../../kit/text.js";
import { LeaderboardSnapshot } from "./leaderboard-snapshot.js";

/** How screens and exports show a leaderboard snapshot. */
export class LeaderboardSnapshotView {
  codeText: string;
  nameText: string;
  campaignRef: string;
  reviewer: string;
  quantity: string;
  impressions: string;
  active: string;
  priorityText: string;
  checksumText: string;
  labelText: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    campaignRef: string,
    reviewer: string,
    quantity: string,
    impressions: string,
    active: string,
    priorityText: string,
    checksumText: string,
    labelText: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.campaignRef = campaignRef;
    this.reviewer = reviewer;
    this.quantity = quantity;
    this.impressions = impressions;
    this.active = active;
    this.priorityText = priorityText;
    this.checksumText = checksumText;
    this.labelText = labelText;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardSnapshotView(item: LeaderboardSnapshot): LeaderboardSnapshotView {
  return new LeaderboardSnapshotView(
    item.code,
    item.name,
    text.truncate(item.campaignRef, 80),
    item.reviewer,
    String(item.quantity),
    String(item.impressions),
    `${item.active}`,
    String(item.priority),
    item.checksum,
    text.truncate(item.label, 64),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardSnapshotViews(items: LeaderboardSnapshot[]): LeaderboardSnapshotView[] {
  const views: LeaderboardSnapshotView[] = [];
  for (const item of items) {
    views.push(toLeaderboardSnapshotView(item));
  }
  return views;
}

export function sumLeaderboardSnapshotView(view: LeaderboardSnapshotView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedQuantity + parsedImpressions + parsedPriority;
}
