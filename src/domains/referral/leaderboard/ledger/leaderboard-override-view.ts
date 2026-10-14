import * as text from "../../../../kit/text.js";
import { LeaderboardOverride } from "./leaderboard-override.js";

/** How screens and exports show a leaderboard override. */
export class LeaderboardOverrideView {
  codeText: string;
  label: string;
  frequencyCap: string;
  nameText: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    frequencyCap: string,
    nameText: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.nameText = nameText;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardOverrideView(item: LeaderboardOverride): LeaderboardOverrideView {
  return new LeaderboardOverrideView(
    item.code,
    text.truncate(item.label, 120),
    String(item.frequencyCap),
    text.truncate(item.name, 64),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardOverrideViews(items: LeaderboardOverride[]): LeaderboardOverrideView[] {
  const views: LeaderboardOverrideView[] = [];
  for (const item of items) {
    views.push(toLeaderboardOverrideView(item));
  }
  return views;
}

export function sumLeaderboardOverrideView(view: LeaderboardOverrideView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedFrequencyCap + parsedGraceDays;
}
