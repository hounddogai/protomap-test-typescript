import { LeaderboardPreference } from "./leaderboard-preference.js";

/** How screens and exports show a leaderboard preference. */
export class LeaderboardPreferenceView {
  code: string;
  label: string;
  cost: string;
  weightText: string;
  reviewer: string;
  externalRef: string;
  startsAt: string;
  locale: string;
  regionText: string;
  timezoneText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cost: string,
    weightText: string,
    reviewer: string,
    externalRef: string,
    startsAt: string,
    locale: string,
    regionText: string,
    timezoneText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.weightText = weightText;
    this.reviewer = reviewer;
    this.externalRef = externalRef;
    this.startsAt = startsAt;
    this.locale = locale;
    this.regionText = regionText;
    this.timezoneText = timezoneText;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardPreferenceView(item: LeaderboardPreference): LeaderboardPreferenceView {
  return new LeaderboardPreferenceView(
    item.code,
    item.label,
    item.cost.toFixed(2),
    item.weight.toFixed(2),
    item.reviewer,
    item.externalRef,
    String(item.startsAt),
    item.locale,
    item.region,
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardPreferenceViews(items: LeaderboardPreference[]): LeaderboardPreferenceView[] {
  const views: LeaderboardPreferenceView[] = [];
  for (const item of items) {
    views.push(toLeaderboardPreferenceView(item));
  }
  return views;
}

export function sumLeaderboardPreferenceView(view: LeaderboardPreferenceView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedCost + parsedWeight + parsedStartsAt;
}
