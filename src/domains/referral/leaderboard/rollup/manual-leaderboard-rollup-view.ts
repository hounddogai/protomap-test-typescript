import * as text from "../../../../kit/text.js";
import { ManualLeaderboardRollup } from "./manual-leaderboard-rollup.js";

/** How screens and exports show a manual leaderboard rollup. */
export class ManualLeaderboardRollupView {
  codeText: string;
  name: string;
  score: string;
  externalRef: string;
  channel: string;
  versionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    score: string,
    externalRef: string,
    channel: string,
    versionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.score = score;
    this.externalRef = externalRef;
    this.channel = channel;
    this.versionText = versionText;
    this.statusLabel = statusLabel;
  }
}

export function toManualLeaderboardRollupView(item: ManualLeaderboardRollup): ManualLeaderboardRollupView {
  return new ManualLeaderboardRollupView(
    item.code,
    text.truncate(item.name, 80),
    item.score.toFixed(2),
    item.externalRef,
    item.channel,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualLeaderboardRollupViews(items: ManualLeaderboardRollup[]): ManualLeaderboardRollupView[] {
  const views: ManualLeaderboardRollupView[] = [];
  for (const item of items) {
    views.push(toManualLeaderboardRollupView(item));
  }
  return views;
}

export function sumManualLeaderboardRollupView(view: ManualLeaderboardRollupView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedScore + parsedVersion;
}
