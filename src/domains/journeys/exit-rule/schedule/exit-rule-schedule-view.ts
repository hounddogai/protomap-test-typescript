import * as text from "../../../../kit/text.js";
import { ExitRuleSchedule } from "./exit-rule-schedule.js";

/** How screens and exports show a exit rule schedule. */
export class ExitRuleScheduleView {
  code: string;
  label: string;
  endsAt: string;
  priority: string;
  attempts: string;
  source: string;
  pinned: string;
  notesText: string;
  minimumText: string;
  thresholdText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    endsAt: string,
    priority: string,
    attempts: string,
    source: string,
    pinned: string,
    notesText: string,
    minimumText: string,
    thresholdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.priority = priority;
    this.attempts = attempts;
    this.source = source;
    this.pinned = pinned;
    this.notesText = notesText;
    this.minimumText = minimumText;
    this.thresholdText = thresholdText;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleScheduleView(item: ExitRuleSchedule): ExitRuleScheduleView {
  return new ExitRuleScheduleView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 40),
    String(item.endsAt),
    String(item.priority),
    String(item.attempts),
    item.source,
    `${item.pinned}`,
    item.notes,
    item.minimum.toFixed(2),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleScheduleViews(items: ExitRuleSchedule[]): ExitRuleScheduleView[] {
  const views: ExitRuleScheduleView[] = [];
  for (const item of items) {
    views.push(toExitRuleScheduleView(item));
  }
  return views;
}

export function sumExitRuleScheduleView(view: ExitRuleScheduleView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedEndsAt + parsedPriority + parsedAttempts;
}
