import * as text from "../../../../kit/text.js";
import { DefaultSenderRule } from "./default-sender-rule.js";

/** How screens and exports show a default sender rule. */
export class DefaultSenderRuleView {
  code: string;
  name: string;
  budget: string;
  score: string;
  conversionRate: string;
  threshold: string;
  ratio: string;
  activeText: string;
  visibleText: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budget: string,
    score: string,
    conversionRate: string,
    threshold: string,
    ratio: string,
    activeText: string,
    visibleText: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.score = score;
    this.conversionRate = conversionRate;
    this.threshold = threshold;
    this.ratio = ratio;
    this.activeText = activeText;
    this.visibleText = visibleText;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultSenderRuleView(item: DefaultSenderRule): DefaultSenderRuleView {
  return new DefaultSenderRuleView(
    item.code,
    text.truncate(item.name, 40),
    item.budget.toFixed(2),
    item.score.toFixed(2),
    item.conversionRate.toFixed(2),
    item.threshold.toFixed(2),
    item.ratio.toFixed(2),
    `${item.active}`,
    `${item.visible}`,
    text.truncate(item.timezone, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultSenderRuleViews(items: DefaultSenderRule[]): DefaultSenderRuleView[] {
  const views: DefaultSenderRuleView[] = [];
  for (const item of items) {
    views.push(toDefaultSenderRuleView(item));
  }
  return views;
}

export function sumDefaultSenderRuleView(view: DefaultSenderRuleView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedBudget + parsedScore + parsedConversionRate;
}
