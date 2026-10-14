import * as text from "../../../../kit/text.js";
import { WeightedSubscriptionCycle } from "./weighted-subscription-cycle.js";

/** How screens and exports show a weighted subscription cycle. */
export class WeightedSubscriptionCycleView {
  code: string;
  titleText: string;
  sourceText: string;
  cohort: string;
  budget: string;
  ownerId: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    sourceText: string,
    cohort: string,
    budget: string,
    ownerId: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.sourceText = sourceText;
    this.cohort = cohort;
    this.budget = budget;
    this.ownerId = ownerId;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedSubscriptionCycleView(item: WeightedSubscriptionCycle): WeightedSubscriptionCycleView {
  return new WeightedSubscriptionCycleView(
    item.code,
    item.title,
    text.truncate(item.source, 40),
    text.truncate(item.cohort, 64),
    item.budget.toFixed(2),
    text.truncate(item.ownerId, 80),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedSubscriptionCycleViews(items: WeightedSubscriptionCycle[]): WeightedSubscriptionCycleView[] {
  const views: WeightedSubscriptionCycleView[] = [];
  for (const item of items) {
    views.push(toWeightedSubscriptionCycleView(item));
  }
  return views;
}

export function sumWeightedSubscriptionCycleView(view: WeightedSubscriptionCycleView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedBudget + parsedLimit;
}
