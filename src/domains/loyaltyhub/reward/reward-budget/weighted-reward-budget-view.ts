import { WeightedRewardBudget } from "./weighted-reward-budget.js";

/** How screens and exports show a weighted reward budget. */
export class WeightedRewardBudgetView {
  code: string;
  name: string;
  campaignRef: string;
  durationMinutesText: string;
  priorityText: string;
  notesText: string;
  archivedText: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    durationMinutesText: string,
    priorityText: string,
    notesText: string,
    archivedText: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.durationMinutesText = durationMinutesText;
    this.priorityText = priorityText;
    this.notesText = notesText;
    this.archivedText = archivedText;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedRewardBudgetView(item: WeightedRewardBudget): WeightedRewardBudgetView {
  return new WeightedRewardBudgetView(
    item.code,
    item.name,
    item.campaignRef,
    String(item.durationMinutes),
    String(item.priority),
    item.notes,
    `${item.archived}`,
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedRewardBudgetViews(items: WeightedRewardBudget[]): WeightedRewardBudgetView[] {
  const views: WeightedRewardBudgetView[] = [];
  for (const item of items) {
    views.push(toWeightedRewardBudgetView(item));
  }
  return views;
}

export function sumWeightedRewardBudgetView(view: WeightedRewardBudgetView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedDurationMinutes + parsedPriority;
}
