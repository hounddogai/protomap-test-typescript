import * as text from "../../../../kit/text.js";
import { ExitRuleAudit } from "./exit-rule-audit.js";

/** How screens and exports show a exit rule audit. */
export class ExitRuleAuditView {
  codeText: string;
  name: string;
  score: string;
  priority: string;
  graceDaysText: string;
  country: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    score: string,
    priority: string,
    graceDaysText: string,
    country: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.score = score;
    this.priority = priority;
    this.graceDaysText = graceDaysText;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleAuditView(item: ExitRuleAudit): ExitRuleAuditView {
  return new ExitRuleAuditView(
    item.code,
    text.truncate(item.name, 80),
    item.score.toFixed(2),
    String(item.priority),
    String(item.graceDays),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleAuditViews(items: ExitRuleAudit[]): ExitRuleAuditView[] {
  const views: ExitRuleAuditView[] = [];
  for (const item of items) {
    views.push(toExitRuleAuditView(item));
  }
  return views;
}

export function sumExitRuleAuditView(view: ExitRuleAuditView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedScore + parsedPriority + parsedGraceDays;
}
