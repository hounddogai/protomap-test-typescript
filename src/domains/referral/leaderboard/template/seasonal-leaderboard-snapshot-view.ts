import * as text from "../../../../kit/text.js";
import { SeasonalLeaderboardSnapshot } from "./seasonal-leaderboard-snapshot.js";

/** How screens and exports show a seasonal leaderboard snapshot. */
export class SeasonalLeaderboardSnapshotView {
  code: string;
  title: string;
  visible: string;
  timezone: string;
  endsAt: string;
  externalRefText: string;
  ceiling: string;
  conversionRate: string;
  createdAt: string;
  labelText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    visible: string,
    timezone: string,
    endsAt: string,
    externalRefText: string,
    ceiling: string,
    conversionRate: string,
    createdAt: string,
    labelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.timezone = timezone;
    this.endsAt = endsAt;
    this.externalRefText = externalRefText;
    this.ceiling = ceiling;
    this.conversionRate = conversionRate;
    this.createdAt = createdAt;
    this.labelText = labelText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalLeaderboardSnapshotView(item: SeasonalLeaderboardSnapshot): SeasonalLeaderboardSnapshotView {
  return new SeasonalLeaderboardSnapshotView(
    text.truncate(item.code, 40),
    item.title,
    `${item.visible}`,
    item.timezone,
    String(item.endsAt),
    item.externalRef,
    item.ceiling.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.createdAt),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalLeaderboardSnapshotViews(items: SeasonalLeaderboardSnapshot[]): SeasonalLeaderboardSnapshotView[] {
  const views: SeasonalLeaderboardSnapshotView[] = [];
  for (const item of items) {
    views.push(toSeasonalLeaderboardSnapshotView(item));
  }
  return views;
}

export function sumSeasonalLeaderboardSnapshotView(view: SeasonalLeaderboardSnapshotView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedEndsAt + parsedCeiling + parsedConversionRate;
}
