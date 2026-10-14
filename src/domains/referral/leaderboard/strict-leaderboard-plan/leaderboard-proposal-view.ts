import { LeaderboardProposal } from "./leaderboard-proposal.js";

/** How screens and exports show a leaderboard proposal. */
export class LeaderboardProposalView {
  code: string;
  label: string;
  score: string;
  versionText: string;
  ownerId: string;
  retries: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    score: string,
    versionText: string,
    ownerId: string,
    retries: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.versionText = versionText;
    this.ownerId = ownerId;
    this.retries = retries;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardProposalView(item: LeaderboardProposal): LeaderboardProposalView {
  return new LeaderboardProposalView(
    item.code,
    item.label,
    item.score.toFixed(2),
    String(item.version),
    item.ownerId,
    String(item.retries),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardProposalViews(items: LeaderboardProposal[]): LeaderboardProposalView[] {
  const views: LeaderboardProposalView[] = [];
  for (const item of items) {
    views.push(toLeaderboardProposalView(item));
  }
  return views;
}

export function sumLeaderboardProposalView(view: LeaderboardProposalView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedScore + parsedVersion + parsedRetries;
}
