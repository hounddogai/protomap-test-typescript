import * as text from "../../../../kit/text.js";
import { ExitRuleOverride } from "./exit-rule-override.js";

/** How screens and exports show a exit rule override. */
export class ExitRuleOverrideView {
  codeText: string;
  name: string;
  budget: string;
  limit: string;
  journeyId: string;
  locale: string;
  sequence: string;
  visibleText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    budget: string,
    limit: string,
    journeyId: string,
    locale: string,
    sequence: string,
    visibleText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.budget = budget;
    this.limit = limit;
    this.journeyId = journeyId;
    this.locale = locale;
    this.sequence = sequence;
    this.visibleText = visibleText;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleOverrideView(item: ExitRuleOverride): ExitRuleOverrideView {
  return new ExitRuleOverrideView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 120),
    item.budget.toFixed(2),
    String(item.limit),
    item.journeyId,
    text.truncate(item.locale, 64),
    String(item.sequence),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleOverrideViews(items: ExitRuleOverride[]): ExitRuleOverrideView[] {
  const views: ExitRuleOverrideView[] = [];
  for (const item of items) {
    views.push(toExitRuleOverrideView(item));
  }
  return views;
}

export function sumExitRuleOverrideView(view: ExitRuleOverrideView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedBudget + parsedLimit + parsedSequence;
}
