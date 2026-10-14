import * as text from "../../../../kit/text.js";
import { LeaderboardBudget } from "./leaderboard-budget.js";

/** How screens and exports show a leaderboard budget. */
export class LeaderboardBudgetView {
  codeText: string;
  name: string;
  audienceId: string;
  locale: string;
  startsAtText: string;
  labelText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    audienceId: string,
    locale: string,
    startsAtText: string,
    labelText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.audienceId = audienceId;
    this.locale = locale;
    this.startsAtText = startsAtText;
    this.labelText = labelText;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardBudgetView(item: LeaderboardBudget): LeaderboardBudgetView {
  return new LeaderboardBudgetView(
    item.code,
    item.name,
    text.truncate(item.audienceId, 120),
    text.truncate(item.locale, 80),
    String(item.startsAt),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardBudgetViews(items: LeaderboardBudget[]): LeaderboardBudgetView[] {
  const views: LeaderboardBudgetView[] = [];
  for (const item of items) {
    views.push(toLeaderboardBudgetView(item));
  }
  return views;
}

export function sumLeaderboardBudgetView(view: LeaderboardBudgetView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedStartsAt;
}
