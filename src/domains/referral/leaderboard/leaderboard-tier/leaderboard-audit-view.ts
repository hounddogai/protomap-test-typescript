import * as text from "../../../../kit/text.js";
import { LeaderboardAudit } from "./leaderboard-audit.js";

/** How screens and exports show a leaderboard audit. */
export class LeaderboardAuditView {
  code: string;
  title: string;
  cohort: string;
  ratio: string;
  archived: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    cohort: string,
    ratio: string,
    archived: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.ratio = ratio;
    this.archived = archived;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardAuditView(item: LeaderboardAudit): LeaderboardAuditView {
  return new LeaderboardAuditView(
    item.code,
    item.title,
    text.truncate(item.cohort, 40),
    item.ratio.toFixed(2),
    `${item.archived}`,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardAuditViews(items: LeaderboardAudit[]): LeaderboardAuditView[] {
  const views: LeaderboardAuditView[] = [];
  for (const item of items) {
    views.push(toLeaderboardAuditView(item));
  }
  return views;
}

export function sumLeaderboardAuditView(view: LeaderboardAuditView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedRatio + parsedEndsAt;
}
