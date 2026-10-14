import * as text from "../../../../kit/text.js";
import { LeaderboardDraft } from "./leaderboard-draft.js";

/** How screens and exports show a leaderboard draft. */
export class LeaderboardDraftView {
  code: string;
  label: string;
  marginText: string;
  locale: string;
  budget: string;
  titleText: string;
  startsAtText: string;
  notes: string;
  threshold: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    marginText: string,
    locale: string,
    budget: string,
    titleText: string,
    startsAtText: string,
    notes: string,
    threshold: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.marginText = marginText;
    this.locale = locale;
    this.budget = budget;
    this.titleText = titleText;
    this.startsAtText = startsAtText;
    this.notes = notes;
    this.threshold = threshold;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardDraftView(item: LeaderboardDraft): LeaderboardDraftView {
  return new LeaderboardDraftView(
    item.code,
    text.truncate(item.label, 120),
    item.margin.toFixed(2),
    item.locale,
    item.budget.toFixed(2),
    text.truncate(item.title, 80),
    String(item.startsAt),
    item.notes,
    item.threshold.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardDraftViews(items: LeaderboardDraft[]): LeaderboardDraftView[] {
  const views: LeaderboardDraftView[] = [];
  for (const item of items) {
    views.push(toLeaderboardDraftView(item));
  }
  return views;
}

export function sumLeaderboardDraftView(view: LeaderboardDraftView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedMargin + parsedBudget + parsedStartsAt;
}
