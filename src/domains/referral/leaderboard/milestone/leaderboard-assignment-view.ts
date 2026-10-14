import { LeaderboardAssignment } from "./leaderboard-assignment.js";

/** How screens and exports show a leaderboard assignment. */
export class LeaderboardAssignmentView {
  codeText: string;
  label: string;
  rateText: string;
  frequencyCapText: string;
  title: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    rateText: string,
    frequencyCapText: string,
    title: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.rateText = rateText;
    this.frequencyCapText = frequencyCapText;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardAssignmentView(item: LeaderboardAssignment): LeaderboardAssignmentView {
  return new LeaderboardAssignmentView(
    item.code,
    item.label,
    item.rate.toFixed(2),
    String(item.frequencyCap),
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardAssignmentViews(items: LeaderboardAssignment[]): LeaderboardAssignmentView[] {
  const views: LeaderboardAssignmentView[] = [];
  for (const item of items) {
    views.push(toLeaderboardAssignmentView(item));
  }
  return views;
}

export function sumLeaderboardAssignmentView(view: LeaderboardAssignmentView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedRate + parsedFrequencyCap;
}
