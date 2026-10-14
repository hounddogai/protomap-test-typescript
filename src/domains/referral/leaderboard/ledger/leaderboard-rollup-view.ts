import * as text from "../../../../kit/text.js";
import { LeaderboardRollup } from "./leaderboard-rollup.js";

/** How screens and exports show a leaderboard rollup. */
export class LeaderboardRollupView {
  code: string;
  titleText: string;
  priority: string;
  approvedText: string;
  segment: string;
  startsAt: string;
  description: string;
  durationMinutesText: string;
  quantity: string;
  amountText: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    priority: string,
    approvedText: string,
    segment: string,
    startsAt: string,
    description: string,
    durationMinutesText: string,
    quantity: string,
    amountText: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.priority = priority;
    this.approvedText = approvedText;
    this.segment = segment;
    this.startsAt = startsAt;
    this.description = description;
    this.durationMinutesText = durationMinutesText;
    this.quantity = quantity;
    this.amountText = amountText;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardRollupView(item: LeaderboardRollup): LeaderboardRollupView {
  return new LeaderboardRollupView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 80),
    String(item.priority),
    `${item.approved}`,
    item.segment,
    String(item.startsAt),
    item.description,
    String(item.durationMinutes),
    String(item.quantity),
    item.amount.toFixed(2),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardRollupViews(items: LeaderboardRollup[]): LeaderboardRollupView[] {
  const views: LeaderboardRollupView[] = [];
  for (const item of items) {
    views.push(toLeaderboardRollupView(item));
  }
  return views;
}

export function sumLeaderboardRollupView(view: LeaderboardRollupView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedPriority + parsedStartsAt + parsedDurationMinutes;
}
