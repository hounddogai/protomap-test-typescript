import * as text from "../../../../kit/text.js";
import { GlobalLeaderboardPlan } from "./global-leaderboard-plan.js";

/** How screens and exports show a global leaderboard plan. */
export class GlobalLeaderboardPlanView {
  code: string;
  name: string;
  country: string;
  graceDays: string;
  journeyIdText: string;
  startsAt: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    country: string,
    graceDays: string,
    journeyIdText: string,
    startsAt: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.graceDays = graceDays;
    this.journeyIdText = journeyIdText;
    this.startsAt = startsAt;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalLeaderboardPlanView(item: GlobalLeaderboardPlan): GlobalLeaderboardPlanView {
  return new GlobalLeaderboardPlanView(
    item.code,
    text.truncate(item.name, 40),
    item.country,
    String(item.graceDays),
    item.journeyId,
    String(item.startsAt),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalLeaderboardPlanViews(items: GlobalLeaderboardPlan[]): GlobalLeaderboardPlanView[] {
  const views: GlobalLeaderboardPlanView[] = [];
  for (const item of items) {
    views.push(toGlobalLeaderboardPlanView(item));
  }
  return views;
}

export function sumGlobalLeaderboardPlanView(view: GlobalLeaderboardPlanView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedGraceDays + parsedStartsAt;
}
