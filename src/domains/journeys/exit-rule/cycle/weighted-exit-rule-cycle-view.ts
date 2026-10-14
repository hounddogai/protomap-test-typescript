import * as text from "../../../../kit/text.js";
import { WeightedExitRuleCycle } from "./weighted-exit-rule-cycle.js";

/** How screens and exports show a weighted exit rule cycle. */
export class WeightedExitRuleCycleView {
  codeText: string;
  titleText: string;
  rate: string;
  budget: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    rate: string,
    budget: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.rate = rate;
    this.budget = budget;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedExitRuleCycleView(item: WeightedExitRuleCycle): WeightedExitRuleCycleView {
  return new WeightedExitRuleCycleView(
    text.truncate(item.code, 80),
    item.title,
    item.rate.toFixed(2),
    item.budget.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedExitRuleCycleViews(items: WeightedExitRuleCycle[]): WeightedExitRuleCycleView[] {
  const views: WeightedExitRuleCycleView[] = [];
  for (const item of items) {
    views.push(toWeightedExitRuleCycleView(item));
  }
  return views;
}

export function sumWeightedExitRuleCycleView(view: WeightedExitRuleCycleView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedRate + parsedBudget + parsedCreatedAt;
}
