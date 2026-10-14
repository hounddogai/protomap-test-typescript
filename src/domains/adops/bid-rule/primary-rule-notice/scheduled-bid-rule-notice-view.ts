import * as text from "../../../../kit/text.js";
import { ScheduledBidRuleNotice } from "./scheduled-bid-rule-notice.js";

/** How screens and exports show a scheduled bid rule notice. */
export class ScheduledBidRuleNoticeView {
  code: string;
  label: string;
  reviewer: string;
  margin: string;
  attemptsText: string;
  audienceId: string;
  priority: string;
  budget: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    margin: string,
    attemptsText: string,
    audienceId: string,
    priority: string,
    budget: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.margin = margin;
    this.attemptsText = attemptsText;
    this.audienceId = audienceId;
    this.priority = priority;
    this.budget = budget;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledBidRuleNoticeView(item: ScheduledBidRuleNotice): ScheduledBidRuleNoticeView {
  return new ScheduledBidRuleNoticeView(
    item.code,
    item.label,
    item.reviewer,
    item.margin.toFixed(2),
    String(item.attempts),
    text.truncate(item.audienceId, 64),
    String(item.priority),
    item.budget.toFixed(2),
    text.truncate(item.description, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledBidRuleNoticeViews(items: ScheduledBidRuleNotice[]): ScheduledBidRuleNoticeView[] {
  const views: ScheduledBidRuleNoticeView[] = [];
  for (const item of items) {
    views.push(toScheduledBidRuleNoticeView(item));
  }
  return views;
}

export function sumScheduledBidRuleNoticeView(view: ScheduledBidRuleNoticeView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedMargin + parsedAttempts + parsedPriority;
}
