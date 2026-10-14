import * as text from "../../../../kit/text.js";
import { SeasonalBadgeBudget } from "./seasonal-badge-budget.js";

/** How screens and exports show a seasonal badge budget. */
export class SeasonalBadgeBudgetView {
  code: string;
  label: string;
  active: string;
  frequencyCap: string;
  channel: string;
  budget: string;
  threshold: string;
  weight: string;
  createdAt: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    active: string,
    frequencyCap: string,
    channel: string,
    budget: string,
    threshold: string,
    weight: string,
    createdAt: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.channel = channel;
    this.budget = budget;
    this.threshold = threshold;
    this.weight = weight;
    this.createdAt = createdAt;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalBadgeBudgetView(item: SeasonalBadgeBudget): SeasonalBadgeBudgetView {
  return new SeasonalBadgeBudgetView(
    text.truncate(item.code, 80),
    item.label,
    `${item.active}`,
    String(item.frequencyCap),
    text.truncate(item.channel, 120),
    item.budget.toFixed(2),
    item.threshold.toFixed(2),
    item.weight.toFixed(2),
    String(item.createdAt),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalBadgeBudgetViews(items: SeasonalBadgeBudget[]): SeasonalBadgeBudgetView[] {
  const views: SeasonalBadgeBudgetView[] = [];
  for (const item of items) {
    views.push(toSeasonalBadgeBudgetView(item));
  }
  return views;
}

export function sumSeasonalBadgeBudgetView(view: SeasonalBadgeBudgetView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedFrequencyCap + parsedBudget + parsedThreshold;
}
