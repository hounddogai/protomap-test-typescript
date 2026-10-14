import * as text from "../../../../kit/text.js";
import { BranchGroup } from "./branch-group.js";

/** How screens and exports show a branch group. */
export class BranchGroupView {
  code: string;
  titleText: string;
  scoreText: string;
  sendAt: string;
  cohort: string;
  durationMinutesText: string;
  budget: string;
  activeText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    scoreText: string,
    sendAt: string,
    cohort: string,
    durationMinutesText: string,
    budget: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.scoreText = scoreText;
    this.sendAt = sendAt;
    this.cohort = cohort;
    this.durationMinutesText = durationMinutesText;
    this.budget = budget;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toBranchGroupView(item: BranchGroup): BranchGroupView {
  return new BranchGroupView(
    text.truncate(item.code, 40),
    item.title,
    item.score.toFixed(2),
    String(item.sendAt),
    text.truncate(item.cohort, 40),
    String(item.durationMinutes),
    item.budget.toFixed(2),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchGroupViews(items: BranchGroup[]): BranchGroupView[] {
  const views: BranchGroupView[] = [];
  for (const item of items) {
    views.push(toBranchGroupView(item));
  }
  return views;
}

export function sumBranchGroupView(view: BranchGroupView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedScore + parsedSendAt + parsedDurationMinutes;
}
