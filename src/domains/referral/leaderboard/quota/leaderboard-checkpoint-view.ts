import * as text from "../../../../kit/text.js";
import { LeaderboardCheckpoint } from "./leaderboard-checkpoint.js";

/** How screens and exports show a leaderboard checkpoint. */
export class LeaderboardCheckpointView {
  codeText: string;
  label: string;
  cohortText: string;
  segmentText: string;
  startsAt: string;
  cost: string;
  ratio: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    cohortText: string,
    segmentText: string,
    startsAt: string,
    cost: string,
    ratio: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.cohortText = cohortText;
    this.segmentText = segmentText;
    this.startsAt = startsAt;
    this.cost = cost;
    this.ratio = ratio;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardCheckpointView(item: LeaderboardCheckpoint): LeaderboardCheckpointView {
  return new LeaderboardCheckpointView(
    item.code,
    item.label,
    text.truncate(item.cohort, 120),
    text.truncate(item.segment, 120),
    String(item.startsAt),
    item.cost.toFixed(2),
    item.ratio.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardCheckpointViews(items: LeaderboardCheckpoint[]): LeaderboardCheckpointView[] {
  const views: LeaderboardCheckpointView[] = [];
  for (const item of items) {
    views.push(toLeaderboardCheckpointView(item));
  }
  return views;
}

export function sumLeaderboardCheckpointView(view: LeaderboardCheckpointView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedStartsAt + parsedCost + parsedRatio;
}
