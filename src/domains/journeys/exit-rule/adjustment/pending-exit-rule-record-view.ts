import * as text from "../../../../kit/text.js";
import { PendingExitRuleRecord } from "./pending-exit-rule-record.js";

/** How screens and exports show a pending exit rule record. */
export class PendingExitRuleRecordView {
  code: string;
  name: string;
  attemptsText: string;
  locale: string;
  labelText: string;
  thresholdText: string;
  budget: string;
  timezone: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    attemptsText: string,
    locale: string,
    labelText: string,
    thresholdText: string,
    budget: string,
    timezone: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.attemptsText = attemptsText;
    this.locale = locale;
    this.labelText = labelText;
    this.thresholdText = thresholdText;
    this.budget = budget;
    this.timezone = timezone;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toPendingExitRuleRecordView(item: PendingExitRuleRecord): PendingExitRuleRecordView {
  return new PendingExitRuleRecordView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 120),
    String(item.attempts),
    item.locale,
    item.label,
    item.threshold.toFixed(2),
    item.budget.toFixed(2),
    item.timezone,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingExitRuleRecordViews(items: PendingExitRuleRecord[]): PendingExitRuleRecordView[] {
  const views: PendingExitRuleRecordView[] = [];
  for (const item of items) {
    views.push(toPendingExitRuleRecordView(item));
  }
  return views;
}

export function sumPendingExitRuleRecordView(view: PendingExitRuleRecordView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedAttempts + parsedThreshold + parsedBudget;
}
