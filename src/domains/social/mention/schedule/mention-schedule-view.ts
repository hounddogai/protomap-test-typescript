import * as text from "../../../../kit/text.js";
import { MentionSchedule } from "./mention-schedule.js";

/** How screens and exports show a mention schedule. */
export class MentionScheduleView {
  code: string;
  nameText: string;
  updatedAt: string;
  activeText: string;
  cohort: string;
  budgetText: string;
  summary: string;
  bid: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    updatedAt: string,
    activeText: string,
    cohort: string,
    budgetText: string,
    summary: string,
    bid: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.updatedAt = updatedAt;
    this.activeText = activeText;
    this.cohort = cohort;
    this.budgetText = budgetText;
    this.summary = summary;
    this.bid = bid;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toMentionScheduleView(item: MentionSchedule): MentionScheduleView {
  return new MentionScheduleView(
    text.truncate(item.code, 40),
    item.name,
    String(item.updatedAt),
    `${item.active}`,
    text.truncate(item.cohort, 64),
    item.budget.toFixed(2),
    text.truncate(item.summary, 64),
    item.bid.toFixed(2),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionScheduleViews(items: MentionSchedule[]): MentionScheduleView[] {
  const views: MentionScheduleView[] = [];
  for (const item of items) {
    views.push(toMentionScheduleView(item));
  }
  return views;
}

export function sumMentionScheduleView(view: MentionScheduleView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedUpdatedAt + parsedBudget + parsedBid;
}
