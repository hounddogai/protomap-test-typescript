import * as text from "../../../../kit/text.js";
import { DefaultRewardRuleBudget } from "./default-reward-rule-budget.js";

/** How screens and exports show a default reward rule budget. */
export class DefaultRewardRuleBudgetView {
  code: string;
  title: string;
  frequencyCap: string;
  description: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    frequencyCap: string,
    description: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.description = description;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultRewardRuleBudgetView(item: DefaultRewardRuleBudget): DefaultRewardRuleBudgetView {
  return new DefaultRewardRuleBudgetView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 64),
    String(item.frequencyCap),
    item.description,
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultRewardRuleBudgetViews(items: DefaultRewardRuleBudget[]): DefaultRewardRuleBudgetView[] {
  const views: DefaultRewardRuleBudgetView[] = [];
  for (const item of items) {
    views.push(toDefaultRewardRuleBudgetView(item));
  }
  return views;
}

export function sumDefaultRewardRuleBudgetView(view: DefaultRewardRuleBudgetView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedFrequencyCap;
}
