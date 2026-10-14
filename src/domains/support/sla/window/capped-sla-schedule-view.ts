import * as text from "../../../../kit/text.js";
import { CappedSlaSchedule } from "./capped-sla-schedule.js";

/** How screens and exports show a capped sla schedule. */
export class CappedSlaScheduleView {
  codeText: string;
  nameText: string;
  archived: string;
  currency: string;
  approved: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    archived: string,
    currency: string,
    approved: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.archived = archived;
    this.currency = currency;
    this.approved = approved;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedSlaScheduleView(item: CappedSlaSchedule): CappedSlaScheduleView {
  return new CappedSlaScheduleView(
    text.truncate(item.code, 64),
    item.name,
    `${item.archived}`,
    text.truncate(item.currency, 40),
    `${item.approved}`,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedSlaScheduleViews(items: CappedSlaSchedule[]): CappedSlaScheduleView[] {
  const views: CappedSlaScheduleView[] = [];
  for (const item of items) {
    views.push(toCappedSlaScheduleView(item));
  }
  return views;
}

export function sumCappedSlaScheduleView(view: CappedSlaScheduleView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
