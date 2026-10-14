import * as text from "../../../../kit/text.js";
import { BranchSnapshot } from "./branch-snapshot.js";

/** How screens and exports show a branch snapshot. */
export class BranchSnapshotView {
  code: string;
  label: string;
  archived: string;
  channelText: string;
  regionText: string;
  priorityText: string;
  notesText: string;
  openRate: string;
  score: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    archived: string,
    channelText: string,
    regionText: string,
    priorityText: string,
    notesText: string,
    openRate: string,
    score: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.channelText = channelText;
    this.regionText = regionText;
    this.priorityText = priorityText;
    this.notesText = notesText;
    this.openRate = openRate;
    this.score = score;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toBranchSnapshotView(item: BranchSnapshot): BranchSnapshotView {
  return new BranchSnapshotView(
    item.code,
    item.label,
    `${item.archived}`,
    text.truncate(item.channel, 120),
    item.region,
    String(item.priority),
    item.notes,
    item.openRate.toFixed(2),
    item.score.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchSnapshotViews(items: BranchSnapshot[]): BranchSnapshotView[] {
  const views: BranchSnapshotView[] = [];
  for (const item of items) {
    views.push(toBranchSnapshotView(item));
  }
  return views;
}

export function sumBranchSnapshotView(view: BranchSnapshotView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedPriority + parsedOpenRate + parsedScore;
}
