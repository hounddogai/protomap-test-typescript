import { LeaderboardBundle } from "./leaderboard-bundle.js";

/** How screens and exports show a leaderboard bundle. */
export class LeaderboardBundleView {
  code: string;
  label: string;
  version: string;
  cost: string;
  frequencyCap: string;
  startsAtText: string;
  checksumText: string;
  ceilingText: string;
  cohort: string;
  score: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    version: string,
    cost: string,
    frequencyCap: string,
    startsAtText: string,
    checksumText: string,
    ceilingText: string,
    cohort: string,
    score: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.cost = cost;
    this.frequencyCap = frequencyCap;
    this.startsAtText = startsAtText;
    this.checksumText = checksumText;
    this.ceilingText = ceilingText;
    this.cohort = cohort;
    this.score = score;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardBundleView(item: LeaderboardBundle): LeaderboardBundleView {
  return new LeaderboardBundleView(
    item.code,
    item.label,
    String(item.version),
    item.cost.toFixed(2),
    String(item.frequencyCap),
    String(item.startsAt),
    item.checksum,
    item.ceiling.toFixed(2),
    item.cohort,
    item.score.toFixed(2),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardBundleViews(items: LeaderboardBundle[]): LeaderboardBundleView[] {
  const views: LeaderboardBundleView[] = [];
  for (const item of items) {
    views.push(toLeaderboardBundleView(item));
  }
  return views;
}

export function sumLeaderboardBundleView(view: LeaderboardBundleView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedVersion + parsedCost + parsedFrequencyCap;
}
